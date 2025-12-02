from pydantic import BaseModel
from typing import List, Optional, Any


class Measurement(BaseModel):
    measurement_type: str
    value: float
    source: Optional[str] = None
    created_at: Optional[str] = None


class MedicalFile(BaseModel):
    file_type: Optional[str] = None
    ipfs_hash: Optional[str] = None
    metadata: Optional[Any] = None


class Prescription(BaseModel):
    medication_name: str
    dosage: Optional[str] = None
    schedule: Optional[str] = None


class PatientProfile(BaseModel):
    age: Optional[int] = None
    gender: Optional[str] = None
    allergies: List[str] = []
    chronic_conditions: List[str] = []


class PatientData(BaseModel):
    profile: PatientProfile
    measurements: List[Measurement] = []
    files: List[MedicalFile] = []
    prescriptions: List[Prescription] = []
