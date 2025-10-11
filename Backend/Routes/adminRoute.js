import express from 'express';
const router = express.Router();
import {
  createAdmin,
  adminLogin
} from '../Controllers/adminController.js';

router.post('/register', createAdmin);
router.post('/login',adminLogin)

export default router;