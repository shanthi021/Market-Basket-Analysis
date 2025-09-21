# Setup Guide - Market Basket Analysis Platform

This guide will help you set up and run the Market Basket Analysis platform on your local machine.

## Quick Start

### Option 1: Using Docker (Recommended)

1. **Clone the repository**
```bash
git clone <repository-url>
cd market-basket-analysis
```

2. **Run with Docker Compose**
```bash
docker-compose up --build
```

This will start both frontend and backend services automatically.

### Option 2: Manual Setup

## Prerequisites

Before starting, ensure you have the following installed:

- **Python 3.8 or higher**
- **Node.js 16 or higher**
- **npm or yarn**
- **Git**

### Check Your Installation

```bash
# Check Python version
python --version

# Check Node.js version
node --version

# Check npm version
npm --version
```

## Backend Setup

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Create Virtual Environment
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Set Environment Variables (Optional)
Create a `.env` file in the backend directory:
```env
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key
DATABASE_URL=sqlite:///market_basket.db
```

### 5. Run the Backend Server
```bash
python app.py
```

The backend will be available at `http://localhost:5000/`

## Frontend Setup

### 1. Navigate to Frontend Directory
```bash
cd frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm start
```

The frontend will be available at `http://localhost:3000/`

## Database Setup

The application uses SQLite database which will be created automatically when you first run the backend.

### Manual Database Initialization (Optional)
```bash
cd backend
python -c "from app import app, db; app.app_context().push(); db.create_all()"
```

## Testing the Installation

### 1. Backend Test
Visit `http://localhost:5000/api/dashboard-stats` in your browser. You should see JSON data with dashboard statistics.

### 2. Frontend Test
Visit `http://localhost:3000` in your browser. You should see the login page.

### 3. Full Application Test
1. Register a new account
2. Login with your credentials
3. Upload a sample CSV file
4. Run K-means analysis
5. Run market basket analysis

## Sample Data

### Create Sample CSV File
Create a file named `sample_data.csv` with the following content:

```csv
customer_id,product_id,product_name,category,quantity,amount,timestamp
1,101,Bread,Bakery,2,5.00,2023-01-01 10:30:00
1,102,Milk,Dairy,1,3.50,2023-01-01 10:30:00
1,103,Eggs,Dairy,1,4.00,2023-01-01 10:30:00
2,101,Bread,Bakery,1,2.50,2023-01-01 11:15:00
2,104,Butter,Dairy,1,4.50,2023-01-01 11:15:00
3,102,Milk,Dairy,2,7.00,2023-01-01 12:00:00
3,105,Coffee,Beverages,1,8.00,2023-01-01 12:00:00
4,101,Bread,Bakery,1,2.50,2023-01-01 13:30:00
4,102,Milk,Dairy,1,3.50,2023-01-01 13:30:00
4,106,Sugar,Pantry,1,2.00,2023-01-01 13:30:00
```

## Troubleshooting

### Common Issues

#### 1. Port Already in Use
If you get a "port already in use" error:

**Backend (Port 5000):**
```bash
# Kill process using port 5000
# On Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# On macOS/Linux:
lsof -ti:5000 | xargs kill -9
```

**Frontend (Port 3000):**
```bash
# Kill process using port 3000
# On Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# On macOS/Linux:
lsof -ti:3000 | xargs kill -9
```

#### 2. Python Dependencies Issues
```bash
# Upgrade pip
pip install --upgrade pip

# Clear pip cache
pip cache purge

# Reinstall requirements
pip install -r requirements.txt --force-reinstall
```

#### 3. Node.js Dependencies Issues
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall dependencies
npm install
```

#### 4. Database Issues
```bash
# Delete existing database
rm market_basket.db

# Restart the backend server
python app.py
```

### Environment-Specific Issues

#### Windows
- Use `venv\Scripts\activate` instead of `source venv/bin/activate`
- Use `python` instead of `python3`
- Ensure Windows Defender doesn't block the application

#### macOS
- You might need to install Xcode command line tools: `xcode-select --install`
- Use `python3` if `python` doesn't work

#### Linux
- Install Python development headers: `sudo apt-get install python3-dev`
- Install Node.js from NodeSource repository for latest version

## Production Deployment

### Backend Deployment
1. Set production environment variables
2. Use a production WSGI server like Gunicorn
3. Set up a reverse proxy with Nginx
4. Use a production database like PostgreSQL

### Frontend Deployment
1. Build the production version: `npm run build`
2. Serve static files with a web server
3. Configure environment variables for production API endpoints

## Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Review the error logs in the terminal
3. Ensure all prerequisites are installed correctly
4. Create an issue in the GitHub repository with:
   - Your operating system
   - Python and Node.js versions
   - Complete error message
   - Steps to reproduce the issue

## Next Steps

After successful setup:

1. Explore the dashboard features
2. Upload your own transaction data
3. Experiment with different analysis parameters
4. Customize the visualizations
5. Integrate with your existing systems
