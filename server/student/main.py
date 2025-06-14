from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import interview, stress, admin

app = FastAPI()

# Allow localhost and 127.0.0.1 (covers all dev browsers)
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    # Add your deployed frontend domain here when ready:
    # "https://your-frontend.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add routers
app.include_router(interview.router)
app.include_router(stress.router)
app.include_router(admin.router)
