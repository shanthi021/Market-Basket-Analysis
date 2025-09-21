# Market Basket Analysis Platform

A comprehensive web application for Market Basket Analysis using Machine Learning algorithms, specifically K-means clustering for customer segmentation and association rule mining for product recommendations.

## Features

### 🔐 Authentication System
- User registration with email validation
- Secure login with JWT tokens
- Password strength validation
- Protected routes

### 📊 Market Basket Analysis
- **K-means Clustering**: Customer segmentation based on purchase behavior
- **Association Rules**: Product recommendation engine
- **Interactive Visualizations**: Real-time charts and graphs
- **Data Upload**: CSV file processing for transaction data

### 🎨 Modern UI/UX
- Responsive design with glassmorphism effects
- Animated background elements
- Interactive charts using Chart.js
- Smooth transitions with Framer Motion

### 📈 Dashboard Features
- Real-time statistics
- Customer segmentation visualization
- Market basket analysis results
- Data export capabilities

## Technology Stack

### Backend
- **Flask**: Python web framework
- **SQLAlchemy**: Database ORM
- **Flask-JWT-Extended**: Authentication
- **scikit-learn**: Machine Learning algorithms
- **pandas**: Data processing
- **numpy**: Numerical computations

### Frontend
- **React**: JavaScript library
- **React Router**: Navigation
- **Styled Components**: CSS-in-JS styling
- **Chart.js**: Data visualization
- **Framer Motion**: Animations
- **Axios**: HTTP client
- **React Hook Form**: Form handling

## Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the Flask application:
```bash
python app.py
```

The backend will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will be available at `http://localhost:3000`

## Usage

### 1. Registration & Login
- Visit the application and create a new account
- Use the registration form with email validation
- Login with your credentials

### 2. Data Upload
- Upload CSV files containing transaction data
- Ensure your CSV has columns for customer ID, product ID, and transaction details

### 3. K-means Analysis
- Click "Run K-means Analysis" to perform customer segmentation
- View the interactive scatter plot showing customer clusters
- Analyze cluster statistics and characteristics

### 4. Market Basket Analysis
- Click "Run Market Basket Analysis" to generate association rules
- View confidence, support, and lift metrics
- Analyze product recommendation rules

## API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login

### Analysis
- `POST /api/upload-data` - Upload transaction data
- `POST /api/kmeans-analysis` - Run K-means clustering
- `POST /api/market-basket-analysis` - Run market basket analysis
- `GET /api/dashboard-stats` - Get dashboard statistics

## Data Format

### CSV Upload Format
Your CSV file should contain the following columns:
- `customer_id`: Unique customer identifier
- `product_id`: Product identifier
- `quantity`: Number of items purchased
- `amount`: Transaction amount
- `timestamp`: Transaction date/time

Example:
```csv
customer_id,product_id,quantity,amount,timestamp
1,101,2,25.50,2023-01-01 10:30:00
1,102,1,15.00,2023-01-01 10:30:00
2,101,1,12.75,2023-01-01 11:15:00
```

## Machine Learning Algorithms

### K-means Clustering
- **Purpose**: Customer segmentation based on purchase behavior
- **Features**: Purchase frequency, amount, product categories
- **Output**: Customer clusters with characteristics

### Association Rule Mining
- **Purpose**: Find product relationships and recommendations
- **Metrics**: Support, Confidence, Lift
- **Output**: Product association rules

## Customization

### Adding New Analysis Types
1. Create new API endpoint in `backend/app.py`
2. Implement the analysis logic
3. Add frontend component for visualization
4. Update the dashboard controls

### Styling Customization
- Modify `frontend/src/index.css` for global styles
- Update component styles in individual files
- Customize color scheme in styled components

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue in the GitHub repository.

## Future Enhancements

- [ ] Real-time data streaming
- [ ] Advanced ML algorithms (Random Forest, Neural Networks)
- [ ] Multi-language support
- [ ] Mobile application
- [ ] Advanced reporting features
- [ ] Integration with external data sources
