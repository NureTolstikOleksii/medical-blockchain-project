import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import {authRouter} from './src/auth/auth.controller.js';
import {adminRouter} from "./src/admin/admin.controller.js";
import {doctorRouter} from "./src/doctor/doctor.controller.js";
import {loginRouter} from "./src/login/login.controller.js";
import {patientRouter} from "./src/patient/patient.controller.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

app.use("/auth", authRouter);
app.use("/admin", adminRouter);
app.use("/doctor", doctorRouter)
app.use("/login", loginRouter);
app.use("/patient", patientRouter);

app.get('/', (req, res) => {
    res.send('Medical Backend is running');
});

app.listen(process.env.PORT || 4000, () => {
    console.log('Server started on port ' + (process.env.PORT || 4000));
});
