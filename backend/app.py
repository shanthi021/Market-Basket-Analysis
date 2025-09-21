# app.py
from flask import Flask, request, jsonify, send_file, Response
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required,
    get_jwt_identity
)
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
import io
import traceback
import logging
import json

# ML imports
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA, TruncatedSVD
from sklearn.preprocessing import StandardScaler
from sklearn.feature_extraction.text import TfidfTransformer

# mlxtend for Apriori (optional)
try:
    from mlxtend.frequent_patterns import apriori, association_rules
    MLXTEND_AVAILABLE = True
except Exception:
    MLXTEND_AVAILABLE = False

# ------------------ FLASK CONFIG ------------------ #
app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///market_basket.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'jwt-secret-string'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# Allow requests from frontend (adjust origins if needed)
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}}, supports_credentials=True)

logging.basicConfig(level=logging.INFO)

# ------------------ MODELS ------------------ #
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    price = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text)

class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    amount = db.Column(db.Float, nullable=False)
    transaction_id = db.Column(db.String(255), nullable=True)

# ------------------ IN-MEMORY STORES ------------------ #
# These are per-process in-memory caches (for demo). For production use persistent storage.
user_data_store = {}              # user_id (str) -> pandas.DataFrame
kmeans_models_store = {}          # user_id (str) -> KMeans model
association_rules_store = {}      # user_id (str) -> list of rules
transaction_matrix_store = {}     # user_id (str) -> DataFrame (customer x product)
user_cluster_assignments = {}     # user_id (str) -> dict(customer_name -> cluster_label)
cluster_labels_store = {}         # user_id (str) -> { cluster_id: label }

# ------------------ HELPERS ------------------ #
def safe_int(val, default):
    try:
        return int(val)
    except Exception:
        return default

def compute_transaction_matrix(df):
    """
    Build customer x product matrix. Supports:
      - 'Customer' & 'Product' columns (preferred)
      - 'user_id' & 'product_id' (legacy)
    Returns pandas DataFrame (rows=customer, cols=product) with counts.
    """
    df_local = df.copy()

    if "Customer" in df_local.columns and "Product" in df_local.columns:
        df_local["Customer"] = df_local["Customer"].astype(str)
        df_local["Product"] = df_local["Product"].astype(str)
        tm = pd.pivot_table(df_local, index="Customer", columns="Product", aggfunc="size", fill_value=0)
        return tm

    if "user_id" in df_local.columns and "product_id" in df_local.columns:
        df_local["user_id"] = df_local["user_id"].astype(str)
        df_local["product_id"] = df_local["product_id"].astype(str)
        tm = pd.pivot_table(df_local, index="user_id", columns="product_id", aggfunc="size", fill_value=0)
        return tm

    return pd.DataFrame()

def compute_apriori_rules_from_transactions(df, min_support=0.01, min_confidence=0.3):
    """
    Compute association rules.
    Accepts dataframes with either:
      - 'transaction_id' & 'product_id'
      - 'Customer' & 'Product' (treat each customer grouping as a transaction)
    If mlxtend is not available, a fallback co-occurrence heuristic is used.
    Returns list of rules with numeric support/confidence/lift (lift may be None -> set to 0).
    """
    try:
        if "transaction_id" in df.columns and "product_id" in df.columns:
            transactions = df.groupby("transaction_id")["product_id"].apply(list)
        elif "Customer" in df.columns and "Product" in df.columns:
            transactions = df.groupby("Customer")["Product"].apply(list)
        else:
            return []

        if transactions.empty:
            return []

        # one-hot encoding
        try:
            one_hot = pd.get_dummies(transactions.apply(pd.Series).stack()).groupby(level=0).max()
        except Exception:
            # fallback build manually
            all_items = sorted({p for items in transactions for p in items})
            rows = []
            for items in transactions:
                rows.append({it: (1 if it in items else 0) for it in all_items})
            one_hot = pd.DataFrame(rows)

        if MLXTEND_AVAILABLE:
            frequent = apriori(one_hot, min_support=min_support, use_colnames=True)
            if frequent.empty:
                return []
            rules = association_rules(frequent, metric="confidence", min_threshold=min_confidence)
            if rules.empty:
                return []
            rules = rules.sort_values(["confidence", "lift"], ascending=False)
            output_rules = []
            for _, row in rules.iterrows():
                antecedent = list(map(str, row["antecedents"])) if row["antecedents"] is not None else []
                consequent = list(map(str, row["consequents"])) if row["consequents"] is not None else []
                output_rules.append({
                    "antecedent": antecedent,
                    "consequent": consequent,
                    "support": float(row["support"]),
                    "confidence": float(row["confidence"]),
                    "lift": float(row["lift"]) if not pd.isnull(row["lift"]) else 0.0
                })
            return output_rules
        else:
            # Fallback: simple co-occurrence and naive confidence
            from collections import defaultdict
            cooc = defaultdict(lambda: defaultdict(int))
            freq = defaultdict(int)
            total_tx = len(transactions)
            for items in transactions:
                uniq = list(set(items))
                for a in uniq:
                    freq[a] += 1
                for a in uniq:
                    for b in uniq:
                        if a != b:
                            cooc[a][b] += 1
            output = []
            for a, targets in cooc.items():
                for b, cnt in targets.items():
                    conf = cnt / max(1, freq[a])
                    support = cnt / max(1, total_tx)
                    if support >= min_support and conf >= min_confidence:
                        output.append({
                            "antecedent": [str(a)],
                            "consequent": [str(b)],
                            "support": float(support),
                            "confidence": float(conf),
                            "lift": 0.0
                        })
            output = sorted(output, key=lambda x: (x['confidence'], x['support']), reverse=True)
            return output

    except Exception as e:
        app.logger.error(f"Apriori failure: {e}\n{traceback.format_exc()}")
        return []

def recommend_from_rules(rules, cart_items, top_k=5):
    """
    Score candidate consequents by confidence * support where antecedent subset matches the cart.
    """
    scores = {}
    cart_set = set([str(x) for x in cart_items])
    for r in rules:
        antecedent = set(map(str, r.get('antecedent', [])))
        if antecedent and antecedent.issubset(cart_set):
            for c in r.get('consequent', []):
                scores[str(c)] = scores.get(str(c), 0.0) + (r.get('confidence', 0.0) * r.get('support', 0.0))
    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return [p for p, _ in ranked[:top_k]]

# ------------------ ROUTES ------------------ #
@app.route('/')
def index():
    return "<h1>Market Basket Analysis Backend Running</h1>"

# ------------------ AUTH ------------------ #
@app.route('/api/register', methods=['POST'])
def register():
    # Accept JSON form or form-encoded
    data = request.get_json(silent=True) or request.form
    username = (data.get('username') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if not username or not email or not password:
        return jsonify({'message': 'Username, email and password are required'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'message': 'Username already exists'}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'Email already exists'}), 400

    try:
        password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
        user = User(username=username, email=email, password_hash=password_hash)
        db.session.add(user)
        db.session.commit()

        access_token = create_access_token(identity=str(user.id))
        # return both keys to be resilient for frontends expecting either name
        return jsonify({
            'message': 'User created successfully',
            'access_token': access_token,
            'token': access_token,
            'user_id': user.id,
            'username': user.username
        }), 201
    except Exception as e:
        db.session.rollback()
        app.logger.error(traceback.format_exc())
        return jsonify({'message': f'Registration failed: {str(e)}'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or request.form
    # accept either email or username to login
    identifier = (data.get('email') or data.get('username') or '').strip()
    password = data.get('password') or ''

    if not identifier or not password:
        return jsonify({'message': 'Email/username and password are required'}), 400

    # try by email first, then username
    user = User.query.filter_by(email=identifier.lower()).first()
    if not user:
        user = User.query.filter_by(username=identifier).first()

    if not user or not bcrypt.check_password_hash(user.password_hash, password):
        return jsonify({'message': 'Invalid credentials'}), 401

    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        'access_token': access_token,
        'token': access_token,
        'user_id': user.id,
        'username': user.username
    }), 200

# ------------------ UPLOAD CSV ------------------ #
@app.route('/api/upload-data', methods=['POST'])
@jwt_required()
def upload_data():
    current_user_id = get_jwt_identity()
    if 'file' not in request.files:
        return jsonify({'message': 'No file uploaded'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'message': 'No file selected'}), 400
    if not file.filename.lower().endswith('.csv'):
        return jsonify({'message': 'Invalid file format - CSV required'}), 400

    try:
        payload = file.stream.read().decode("utf-8")
        df = pd.read_csv(io.StringIO(payload))
        # Normalize some common columns (case-insensitive)
        df.columns = [c.strip() for c in df.columns]
        # store
        user_data_store[str(current_user_id)] = df

        # clear caches
        kmeans_models_store.pop(str(current_user_id), None)
        association_rules_store.pop(str(current_user_id), None)
        transaction_matrix_store.pop(str(current_user_id), None)
        user_cluster_assignments.pop(str(current_user_id), None)
        cluster_labels_store.pop(str(current_user_id), None)

        return jsonify({'message': 'Data uploaded successfully', 'rows': int(len(df)), 'columns': int(len(df.columns))}), 200
    except Exception as e:
        app.logger.error(traceback.format_exc())
        return jsonify({'message': f'Error processing file: {str(e)}'}), 400

# ------------------ KMEANS ------------------ #
@app.route('/api/kmeans-analysis', methods=['POST'])
@jwt_required()
def kmeans_analysis():
    current_user_id = get_jwt_identity()
    if str(current_user_id) not in user_data_store:
        return jsonify({'message': 'No data uploaded for analysis. Upload a CSV first.'}), 400

    df = user_data_store[str(current_user_id)].copy()
    data = request.get_json(silent=True) or {}
    n_clusters = safe_int(data.get('n_clusters', 3), 3)

    try:
        tm = compute_transaction_matrix(df)
        if tm.empty:
            return jsonify({'message': 'Not enough data to compute transaction matrix. CSV must contain Customer & Product (or user_id & product_id) columns.'}), 400

        # persist raw transaction matrix
        transaction_matrix_store[str(current_user_id)] = tm.copy()

        # clamp clusters
        n_clusters = max(1, min(n_clusters, tm.shape[0]))

        # TF-IDF transform to reduce heavy-user dominance
        try:
            tfidf = TfidfTransformer()
            X = tfidf.fit_transform(tm.values)
        except Exception:
            X = tm.values.astype(float)

        # If sparse, reduce dims or convert
        try:
            if hasattr(X, 'shape') and X.shape[1] > 200:
                svd = TruncatedSVD(n_components=min(50, X.shape[1]-1), random_state=42)
                X_reduced = svd.fit_transform(X)
            else:
                X_reduced = X.toarray() if hasattr(X, 'toarray') else np.array(X, dtype=float)
        except Exception:
            X_reduced = X.toarray() if hasattr(X, 'toarray') else np.array(X, dtype=float)

        scaler = StandardScaler(with_mean=False)
        X_scaled = scaler.fit_transform(X_reduced)

        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        labels = kmeans.fit_predict(X_scaled)

        # store model and assignments
        kmeans_models_store[str(current_user_id)] = kmeans
        assignments = dict(zip(tm.index.astype(str).tolist(), labels.tolist()))
        user_cluster_assignments[str(current_user_id)] = assignments

        # cluster stats
        cluster_stats = []
        for i in range(n_clusters):
            members = [u for u, lab in assignments.items() if lab == i]
            cluster_df = tm.loc[members] if members else pd.DataFrame()
            total_customers = int(len(members))
            avg_items = float(cluster_df.sum(axis=1).mean()) if not cluster_df.empty else 0.0
            most_purchased = cluster_df.sum(axis=0).nlargest(5).index.tolist() if not cluster_df.empty else []
            category_label = cluster_labels_store.get(str(current_user_id), {}).get(str(i), f'Cluster {i}')
            cluster_stats.append({
                'cluster_id': i,
                'category': category_label,
                'total_customers': total_customers,
                'avg_purchase_frequency': avg_items,
                'most_purchased_products': most_purchased,
                # centroid will be computed in 2D PCA below and attached later if available
            })

        # create 2D projection for visualization
        try:
            if X_reduced.shape[1] >= 2:
                pca = PCA(n_components=2, random_state=42)
                pca_2d = pca.fit_transform(X_reduced)
                explained = pca.explained_variance_ratio_.tolist()
            else:
                svd = TruncatedSVD(n_components=2, random_state=42)
                pca_2d = svd.fit_transform(X_reduced)
                explained = svd.explained_variance_ratio_.tolist()
        except Exception:
            pca_2d = np.zeros((len(labels), 2))
            explained = [0.0, 0.0]

        # centroids in 2D
        centroids_2d = []
        for i in range(n_clusters):
            idxs = [idx for idx, lab in enumerate(labels) if lab == i]
            if idxs:
                pts = pca_2d[idxs]
                centroid = [float(pts[:,0].mean()), float(pts[:,1].mean())]
            else:
                centroid = [0.0, 0.0]
            centroids_2d.append(centroid)
            # attach to cluster_stats
            cluster_stats[i]['centroid'] = centroid

        # prepare visualization points, include customer name & possible age if provided in original df
        # Build mapping from original data DF to customer info
        customer_info = {}
        if 'Customer' in df.columns:
            # build mapping of Customer -> maybe age or name columns
            if 'age' in df.columns or 'Age' in df.columns:
                age_col = 'age' if 'age' in df.columns else 'Age'
            else:
                age_col = None
            # The uploaded df may have multiple rows per customer; take first appearance for extra metadata
            for _, row in df.iterrows():
                cust = str(row.get('Customer'))
                if cust not in customer_info:
                    customer_info[cust] = {
                        'customer_name': cust,
                        'age': int(row[age_col]) if age_col and pd.notna(row.get(age_col)) else None
                    }
        else:
            # fallback use index names (user_id)
            for idx in tm.index:
                customer_info[str(idx)] = {'customer_name': str(idx), 'age': None}

        visualization_data = []
        for idx, cust in enumerate(tm.index.astype(str)):
            info = customer_info.get(cust, {'customer_name': cust, 'age': None})
            visualization_data.append({
                'x': float(pca_2d[idx, 0]),
                'y': float(pca_2d[idx, 1]),
                'cluster': int(labels[idx]),
                'user_id': str(cust),
                'customer_name': info.get('customer_name') or str(cust),
                'age': info.get('age')
            })

        return jsonify({
            'clusters': cluster_stats,
            'visualization_data': visualization_data,
            'explained_variance_ratio': explained
        }), 200

    except Exception as e:
        app.logger.error(traceback.format_exc())
        return jsonify({'message': f'Error during K-Means: {str(e)}'}), 500

# ------------------ MARKET BASKET ANALYSIS ------------------ #
@app.route('/api/market-basket-analysis', methods=['POST'])
@jwt_required()
def market_basket_analysis():
    current_user_id = get_jwt_identity()
    if str(current_user_id) not in user_data_store:
        return jsonify({'message': 'No data uploaded. Upload CSV first.'}), 400
    df = user_data_store[str(current_user_id)]
    try:
        data = request.get_json(silent=True) or {}
        min_support = float(data.get('min_support', 0.01))
        min_confidence = float(data.get('min_confidence', 0.25))

        rules = compute_apriori_rules_from_transactions(df, min_support, min_confidence)

        safe_rules = []
        for r in rules:
            safe_rules.append({
                'antecedent': [str(x) for x in r.get('antecedent', [])],
                'consequent': [str(x) for x in r.get('consequent', [])],
                'support': float(r.get('support', 0.0) or 0.0),
                'confidence': float(r.get('confidence', 0.0) or 0.0),
                'lift': float(r.get('lift')) if r.get('lift') is not None else 0.0
            })

        association_rules_store[str(current_user_id)] = safe_rules
        return jsonify({'association_rules': safe_rules, 'total_rules': len(safe_rules)}), 200
    except Exception as e:
        app.logger.error(traceback.format_exc())
        return jsonify({'message': f'Error during MBA: {str(e)}'}), 500

# ------------------ RECOMMEND ------------------ #
@app.route('/api/recommend', methods=['POST'])
@jwt_required()
def recommend():
    current_user_id = get_jwt_identity()
    payload = request.get_json(silent=True) or {}
    cart = payload.get('cart', [])
    top_k = safe_int(payload.get('top_k', 5), 5)
    target_user = str(payload.get('user_id', current_user_id))

    # rules
    rules = association_rules_store.get(str(current_user_id), [])
    if not rules and str(current_user_id) in user_data_store:
        rules = compute_apriori_rules_from_transactions(user_data_store[str(current_user_id)])
        association_rules_store[str(current_user_id)] = rules

    recs_by_rules = recommend_from_rules(rules, cart, top_k)

    # cluster boost
    cluster_boost = []
    try:
        assignments = user_cluster_assignments.get(str(current_user_id), {})
        tm = transaction_matrix_store.get(str(current_user_id))
        if tm is not None and target_user in assignments:
            cluster_id = assignments[target_user]
            members = [u for u, lab in assignments.items() if lab == cluster_id]
            if members:
                cluster_df = tm.loc[members]
                popular = cluster_df.sum(axis=0).nlargest(top_k).index.tolist()
                cluster_boost = [str(p) for p in popular if p not in cart][:top_k]
    except Exception:
        app.logger.exception("Cluster boost failed")

    # combine
    final = []
    seen = set()
    for item in recs_by_rules + cluster_boost:
        if item not in seen:
            final.append(item)
            seen.add(item)
        if len(final) >= top_k:
            break

    return jsonify({'recommendations': final, 'by_rules': recs_by_rules, 'cluster_boost': cluster_boost}), 200

# ------------------ DASHBOARD STATS ------------------ #
@app.route('/api/dashboard-stats', methods=['GET'])
@jwt_required()
def dashboard_stats():
    current_user_id = get_jwt_identity()
    if str(current_user_id) not in user_data_store:
        return jsonify({'message': 'No data uploaded'}), 400

    df = user_data_store[str(current_user_id)]
    try:
        stats = {
            'total_customers': int(df['Customer'].nunique()) if 'Customer' in df.columns else (int(df['user_id'].nunique()) if 'user_id' in df.columns else 0),
            'total_products': int(df['Product'].nunique()) if 'Product' in df.columns else (int(df['product_id'].nunique()) if 'product_id' in df.columns else 0),
            'total_transactions': int(df['transaction_id'].nunique()) if 'transaction_id' in df.columns else len(df.index),
            'rows': int(len(df.index)),
            'columns': int(len(df.columns))
        }

        # top categories if available
        top_categories = []
        if 'Category' in df.columns:
            top = df['Category'].value_counts().head(5)
            top_categories = [{'name': k, 'count': int(v)} for k, v in top.items()]
            stats['top_categories'] = top_categories

        return jsonify(stats), 200
    except Exception as e:
        app.logger.error(traceback.format_exc())
        return jsonify({'message': f'Error generating stats: {str(e)}'}), 500

# ------------------ DOWNLOAD ENDPOINTS (ADDED) ------------------ #

@app.route('/api/download/transaction-matrix', methods=['GET'])
@jwt_required()
def download_transaction_matrix():
    """
    Returns the transaction matrix for the current user as a CSV attachment.
    """
    current_user_id = get_jwt_identity()
    tm = transaction_matrix_store.get(str(current_user_id))
    if tm is None:
        # attempt to compute
        df = user_data_store.get(str(current_user_id))
        if df is None:
            return jsonify({'message': 'No data available to build transaction matrix'}), 400
        tm = compute_transaction_matrix(df)
        if tm.empty:
            return jsonify({'message': 'Unable to compute transaction matrix - check CSV format'}), 400
    try:
        buf = io.BytesIO()
        tm.to_csv(buf)
        buf.seek(0)
        filename = f"transaction_matrix_user_{current_user_id}.csv"
        # send_file with as_attachment
        return send_file(buf, mimetype='text/csv', as_attachment=True, download_name=filename)
    except Exception:
        app.logger.error(traceback.format_exc())
        return jsonify({'message': 'Failed to generate CSV'}), 500

@app.route('/api/download/kmeans', methods=['GET'])
@jwt_required()
def download_kmeans_output():
    """
    Returns KMeans analysis outputs (visualization points + cluster stats) as:
      - visualization_data.csv (rows = customers with x,y,cluster,user_id,etc)
      - cluster_stats.json (clusters metadata)
    Packaged as a single CSV (visualization) or JSON depending on 'format' query param.
    """
    current_user_id = get_jwt_identity()
    fmt = (request.args.get('format') or 'csv').lower()
    # try to reconstruct last kmeans results from stores:
    tm = transaction_matrix_store.get(str(current_user_id))
    assignments = user_cluster_assignments.get(str(current_user_id))
    clusters = None
    visualization_data = None

    # If user recently ran kmeans_analysis the visualization data is not stored by default; we will try to re-run kmeans_analysis logic minimally if needed.
    # First, attempt to get visualization_data from a recent run saved in memory (we didn't store it previously). If not present, compute simple outputs:
    try:
        # If kmeans model exists and transaction matrix exists, try to regenerate viz array quickly
        kmeans_model = kmeans_models_store.get(str(current_user_id))
        if tm is not None and kmeans_model is not None and assignments is not None:
            # create a simple visualization dataframe: put index, cluster, and basic counts
            viz_rows = []
            for cust, lab in assignments.items():
                row = {
                    'user_id': cust,
                    'cluster': int(lab),
                    'total_items': int(tm.loc[cust].sum()) if cust in tm.index else 0
                }
                viz_rows.append(row)
            visualization_data = pd.DataFrame(viz_rows)
            # cluster stats: if stored in kmeans_models_store we did not keep cluster_stats; build simple summary:
            clusters = []
            for cid in sorted(set(assignments.values())):
                members = [u for u, lab in assignments.items() if lab == cid]
                cluster_df = tm.loc[members] if members else pd.DataFrame()
                clusters.append({
                    'cluster_id': int(cid),
                    'total_customers': int(len(members)),
                    'avg_purchase_frequency': float(cluster_df.sum(axis=1).mean()) if not cluster_df.empty else 0.0,
                    'most_purchased_products': cluster_df.sum(axis=0).nlargest(5).index.tolist() if not cluster_df.empty else []
                })
        else:
            # fallback: if transaction matrix exists, build a minimal CSV (user_id, total_items)
            if tm is not None:
                visualization_data = pd.DataFrame([
                    {'user_id': str(idx), 'total_items': int(tm.loc[idx].sum())}
                    for idx in tm.index
                ])
                clusters = []
            else:
                return jsonify({'message': 'No KMeans or transaction data available to download'}), 400

        if fmt == 'json':
            payload = {
                'clusters': clusters,
                'visualization_data': visualization_data.to_dict(orient='records')
            }
            data = json.dumps(payload, default=str)
            buf = io.BytesIO(data.encode('utf-8'))
            buf.seek(0)
            filename = f"kmeans_output_user_{current_user_id}.json"
            return send_file(buf, mimetype='application/json', as_attachment=True, download_name=filename)
        else:
            # default CSV: visualization_data CSV (if you want cluster_stats separately, request format=json)
            buf = io.BytesIO()
            # ensure columns are ordered sensibly
            visualization_data.to_csv(buf, index=False)
            buf.seek(0)
            filename = f"kmeans_visualization_user_{current_user_id}.csv"
            return send_file(buf, mimetype='text/csv', as_attachment=True, download_name=filename)
    except Exception:
        app.logger.error(traceback.format_exc())
        return jsonify({'message': 'Failed to generate KMeans download'}), 500

@app.route('/api/download/association-rules', methods=['GET'])
@jwt_required()
def download_association_rules():
    """
    Returns association rules as CSV or JSON depending on 'format' query param.
    """
    current_user_id = get_jwt_identity()
    fmt = (request.args.get('format') or 'csv').lower()
    rules = association_rules_store.get(str(current_user_id))
    if rules is None or len(rules) == 0:
        # attempt to compute rules
        df = user_data_store.get(str(current_user_id))
        if df is None:
            return jsonify({'message': 'No data available to build association rules'}), 400
        rules = compute_apriori_rules_from_transactions(df)

    try:
        if fmt == 'json':
            data = json.dumps({'association_rules': rules}, default=str)
            buf = io.BytesIO(data.encode('utf-8'))
            buf.seek(0)
            filename = f"association_rules_user_{current_user_id}.json"
            return send_file(buf, mimetype='application/json', as_attachment=True, download_name=filename)
        else:
            # build a flattened DataFrame for CSV export
            rows = []
            for r in rules:
                rows.append({
                    'antecedent': ','.join(map(str, r.get('antecedent', []))),
                    'consequent': ','.join(map(str, r.get('consequent', []))),
                    'support': float(r.get('support', 0.0) or 0.0),
                    'confidence': float(r.get('confidence', 0.0) or 0.0),
                    'lift': float(r.get('lift', 0.0) or 0.0)
                })
            df_rules = pd.DataFrame(rows)
            buf = io.BytesIO()
            df_rules.to_csv(buf, index=False)
            buf.seek(0)
            filename = f"association_rules_user_{current_user_id}.csv"
            return send_file(buf, mimetype='text/csv', as_attachment=True, download_name=filename)
    except Exception:
        app.logger.error(traceback.format_exc())
        return jsonify({'message': 'Failed to generate association rules download'}), 500

# ------------------ RUN ------------------ #
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='127.0.0.1', port=5000)
