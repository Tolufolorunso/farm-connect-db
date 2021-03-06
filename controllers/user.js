const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const {
  farmerRegistrationValidation,
  investorRegistrationValidation,
  loginValidation,
} = require('../middleware/validation');
const Joi = require('@hapi/joi');
const { findByIdAndUpdate } = require('../models/email');
const deleteImg = require('../utils/deleteImage');

exports.signupFarmer = async (req, res, next) => {
  try {
    const userExists = await User.findOne({ email: req.body.email });
    if (userExists) {
      return res.status(400).json({
        status: false,
        message: 'This email already exists',
      });
    }
    req.body.role = 'farmer';

    await User.create(req.body);

    res.status(201).json({
      status: true,
      message: 'User registered successfully',
    });
  } catch (error) {
    res.status(400).json({
      status: false,
      message: 'registration not successfull',
      data: {
        error: error.message,
      },
    });
  }
};

exports.signupInvestor = async (req, res, next) => {
  try {
    const userExists = await User.findOne({ email: req.body.email });
    if (userExists) {
      return res.status(400).json({
        status: false,
        message: 'This email already exists',
      });
    }
    req.body.role = 'investor';

    await User.create(req.body);

    res.status(201).json({
      status: true,
      message: 'User registered successfully',
    });
  } catch (error) {
    res.status(400).json({
      status: false,
      message: 'registration not successfull',
      data: {
        error: error.message,
      },
    });
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    //check if user enter email and paasword
    if (!email || !password) {
      throw new Error('Please enter email and password');
    }

    //I'm Checking here if user exist in DB
    let user = await User.findOne({
      email,
    }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
      throw new Error('Incorrect email or password');
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      }
    );

    user = user.toObject();
    delete user.password;

    res.status(200).json({
      status: true,
      message: 'You are logged in successfully',
      token,
      user,
    });
  } catch (error) {
    console.log(error.message);
    res.status(400).json({
      status: false,
      message: 'unable to login',
      data: {
        error: error.message,
      },
    });
  }
};

exports.farmerProfileUpdate = async (req, res, next) => {
  //this line will override user if they want to change thier role to admin,
  req.body.role = 'farmer';
  try {
    if (req.file.filename) {
      req.body.image = req.file.filename;
    }

    const farmer = await User.findByIdAndUpdate(req.params.farmerId, req.body, {
      new: true,
      runValidators: true,
    }).select('-__v');

    if (!farmer) {
      deleteImg(req.file.filename);
      return res.status(404).json({
        status: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      status: true,
      message: 'User profile successfully updated',
      data: {
        farmer,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: 'Server error',
      data: {
        errorMessage: error.message,
      },
    });
  }
};

exports.getAllFarmers = async (req, res, next) => {
  try {
    const farmers = await User.find({
      role: 'farmer',
    }).select('-__v');

    res.status(200).json({
      status: 'success',
      result: farmers.length,
      data: {
        farmers,
      },
    });
  } catch (error) {
    res.status(404).json({
      status: 'fail',
      data: {
        error: error.message,
      },
    });
  }
};

exports.getAllInvestors = async (req, res, next) => {
  try {
    const investors = await User.find({
      role: 'investor',
    }).select('-__v');
    res.status(200).json({
      status: 'success',
      result: investors.length,
      data: {
        investors,
      },
    });
  } catch (error) {
    res.status(404).json({
      status: 'fail',
      data: {
        error: error.message,
      },
    });
  }
};

exports.investorProfileUpdate = async (req, res, next) => {
  //this line will override user if they want to change thier role to admin,
  req.body.role = 'investor';
  try {
    if (req.file.filename) {
      req.body.image = req.file.filename;
    }

    const investor = await User.findByIdAndUpdate(
      req.params.investorId,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    ).select('-__v');

    if (!investor) {
      deleteImg(req.file.filename);
      return res.status(404).json({
        status: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      status: true,
      message: 'User profile successfully updated',
      data: {
        investor,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: 'Server error',
      data: {
        errorMessage: error.message,
      },
    });
  }
};

exports.getAFarmer = async (req, res, next) => {
  try {
    const farmer = await User.findById(req.params.farmerId).select('-__v');
    if (!farmer) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found',
      });
    }
    console.log(farmer);
    res.status(200).json({
      status: 'success',
      data: {
        farmer,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: 'Problem occurs',
      data: {
        error: error.message,
      },
    });
  }
};
exports.getAInvestor = async (req, res, next) => {
  try {
    const investor = await User.findOne({
      _id: req.params.investorId,
      role: 'investor',
    }).select('-__v');
    if (!investor) {
      return res.status(404).json({
        status: false,
        message: 'User not found',
      });
    }
    res.status(200).json({
      status: true,
      data: {
        investor,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: 'Problem occurs',
      data: {
        error: error.message,
      },
    });
  }
};
