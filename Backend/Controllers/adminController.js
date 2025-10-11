import Tutor from '../Model/TutorModel.js';
import User from '../Model/usermodel.js';
import Admin from '../Model/AdminModel.js';
import { generateAccessToken, generateRefreshToken } from '../utils/generateToken.js';
import { sendPasswordResetEmail } from '../utils/emailService.js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

const createAdmin = async (req, res, next) => {
  try {
    const { full_name, email, password, role } = req.body;

    if (!full_name || !email || !password) {
      res.status(400);
      throw new Error('Please provide all required fields: full_name, email, password');
    }

    const adminExists = await Admin.findOne({ email });

    if (adminExists) {
      res.status(400);
      throw new Error('Admin with this email already exists');
    }

    const admin = await Admin.create({
      full_name,
      email,
      password, 
      admin_id: uuidv4(),
      role: role || 'admin', 
    });

    if (admin) {
      res.status(201).json({
        message: 'Admin created successfully.',
        admin: { _id: admin._id, full_name: admin.full_name, email: admin.email, role: admin.role },
      });
    } else {
      res.status(400);
      throw new Error('Invalid admin data');
    }
  } catch (error) {
    next(error); 
  }
};

const adminLogin= async(req,res)=>{
  try{
  const {email,password} = req.body;
  const admin = await Admin.findOne({email});

  if(!admin){
    return res.status(400).json({message:"Admin not found"})
  }
  if(admin && (await admin.matchPassword(password))){
  const refreshToken=generateRefreshToken(admin._id);
  const accessToken=generateAccessToken(admin._id);
  
  admin.refreshToken=refreshToken;
  await admin.save();

  res.cookie('jwt_admin',accessToken,{
    httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  })

 return res.status(200).json({
    _id:admin._id,
    full_name:admin.full_name,
    email:admin.email,
     accessToken:accessToken
  })
}
else{
  return res.status(400).json({message:"Invalid Email or username"})
}

} catch(error){
  return res.status(500).json({message:"Server error during login"})
}
}



export { createAdmin , adminLogin};
