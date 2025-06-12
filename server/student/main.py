from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import interview, stress, admin

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(interview.router)
app.include_router(stress.router)
app.include_router(admin.router)