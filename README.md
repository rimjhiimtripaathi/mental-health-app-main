# mental-health-app

mental-health-app

mental-health-app/
├── backend/
│ ├── app/
│ │ ├── **init**.py
│ │ ├── main.py
│ │ ├── models/
│ │ ├── routes/
│ │ ├── services/
│ │ └── utils/
│ ├── requirements.txt
│ └── .env
└── frontend/
├── public/
├── src/
│ ├── components/
│ ├── pages/
│ ├── services/
│ ├── styles/
│ └── utils/
├── package.json
└── tailwind.config.js

2.10 Requirements File
txt

# backend/requirements.txt

fastapi==0.104.1
uvicorn==0.24.0
python-multipart==0.0.6
python-jose==3.3.0
passlib==1.7.4
bcrypt==4.0.1
python-dotenv==1.0.0
pillow==10.1.0
torch==2.1.0
transformers==4.35.0
numpy==1.24.3
opencv-python-headless==4.8.1.78
pydantic==2.5.0
2.11 Environment File
bash

# backend/.env

# Environment configuration

DEBUG=true
SECRET_KEY=your-secret-key-here 3. Initialize Required Directories
bash

# Create data directory for JSON storage

mkdir -p backend/data 4. Install Dependencies
bash

# Navigate to backend directory

cd backend

# Create virtual environment (recommended)

python -m venv venv

# Activate virtual environment

# On Windows:

venv\Scripts\activate

# On macOS/Linux:

source venv/bin/activate

# Install dependencies

pip install -r requirements.txt 5. Run the Backend Server
bash

# Run the FastAPI server with auto-reload

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 6. Verify Backend is Running
Open your browser and go to:

API Documentation: http://localhost:8000/api/docs

Alternative Docs: http://localhost:8000/api/redoc

Health Check: http://localhost:8000/api/health

You should see:

✅ Swagger UI with all API endpoints

✅ Health check returning "healthy"

✅ Ability to test authentication endpoints

7. Test the Backend
   Test Registration:

Go to /api/auth/register in Swagger UI

Use this test data:

json
{
"email": "test@example.com",
"full_name": "Test User",
"password": "password123"
}
You should get a JWT token back

Test Login:

Use the same credentials in /api/auth/login

You should get a JWT token

Test AI Models Status:

Go to /api/ai/models-status

Check if models are loaded successfully

8. Troubleshooting Common Issues
   Issue: Models not loading

bash

# Install additional dependencies if needed

pip install librosa soundfile
Issue: Port already in use

bash

# Kill process using port 8000

sudo lsof -t -i tcp:8000 | xargs kill -9

# Or use a different port

uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
Issue: CUDA out of memory (if using GPU)

python

# In ai_analysis_service.py, add this before model inference

torch.cuda.empty_cache() 9. Production Considerations
For production deployment:

Use a real database (PostgreSQL, MongoDB) instead of JSON files

Set proper environment variables for secrets

Use a process manager like PM2 or systemd

Set up reverse proxy with Nginx

Enable HTTPS with SSL certificates

Implement rate limiting

Add proper logging

Set up monitoring and alerts

The backend should now be fully functional and ready to serve the React frontend!
