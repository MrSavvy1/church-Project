const bcrypt = require('bcrypt');
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const nodemailer = require('nodemailer');
const Transaction = require('../models/transaction.model');
const Church = require('../models/church.model');
const sendEmailController = require('../controllers/sendEmail');
const Role = require('../models/role.model');

module.exports = {
  async signup(req, res) {
    try {
      const { useremail, phonenumber, password, language, avatarUrl, userName, GoogleorFacebook } = req.body;
      console.log("hhhh", useremail)

      // const user = await User.findOne({ $and: [{ userEmail: useremail }, { phoneNumber: phonenumber }] });
      const user = await User.findOne({ userEmail: useremail });

      console.log("user", user)

      if (user != null) {
        return res.status(401).json({ message: 'User already exists', error: 'User already exists' });
      }

      const phoneUser = await User.findOne({ phoneNumber: phonenumber });
      if (phoneUser != null) {
        return res.status(401).json({ message: 'Phone already exists.', error: 'Phone already exists.' });
      }

      let rPassword;
      if (!password) {rPassword = "";}
      else {rPassword = password;}
      const hashedPassword = await bcrypt.hash(rPassword, 10);
      const verifyCode = parseInt(Math.random() * 899999) + 100000;
      console.log('verifyCode', verifyCode);
      const church = await Church.find();
      // Upload avatar if provided
      let finalAvatarUrl = "https://villagesonmacarthur.com/wp-content/uploads/2020/12/Blank-Avatar.png"; // Default avatar
      if (avatarUrl) {
        try {
          const uploadResponse = await axios.post(`${process.env.BASE_URL}/upload`, avatarUrl, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          finalAvatarUrl = `${process.env.BASE_URL}/image/${uploadResponse.data.file.filename}`;
        } catch (error) {
          console.error("Error uploading avatar:", error.message);
        }
      }
        

      const newUser = await User.create({
        userName: userName,
        userEmail: useremail,
        verifyCode: verifyCode,
        phoneNumber: phonenumber,
        GoogleorFacebook: GoogleorFacebook ?? false, 
        birth: new Date,
        language: language,
        address: "",
        password: hashedPassword,
        avatarUrl:  finalAvatarUrl,
        church: church[0] == null ? "" : church[0]?._id,
        role: "user",
        status: true
      });

      const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET_KEY, { expiresIn: '6h' });

      // send Email to the user for checking 6 digits verify code
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
           user: process.env.GMAIL_USER,
           pass: process.env.GMAIL_PASS
       }
    });

    const mailOptions = {
        from: '"Monegliseci Team" <no-reply@monegliseci.com>',
        to: useremail,
        subject: "Sign up to your monegliseci.com account",
        html: `<h1>Hi ${userName}</h1>
               <p>Please enter the following verification code to verify this signup attempt:</p>
               <h2>${verifyCode}</h2>
               <p>Don't recognize this signup attempt?</p>
               <p>Regards,<br>The Monegliseci Team</p>`
    };

      await transporter.sendMail(mailOptions);
      console.log('Verification email sent.');

     res.status(201).json({ message: 'Signup successful', user: newUser, token: token });
 } catch (error) {
    console.log('Signup error:', error);
    res.status(500).json({ error: 'Error', 'Server Error': 'Failed' });
  }
},


  async signupAuth(req, res) {
    try {
      const { useremail, verifyCode } = req.body;
      console.log("signupAuth email", useremail);

      // const user = await User.findOne({ $and: [{ userEmail: useremail }, { phoneNumber: phonenumber }] });
      const user = await User.findOne({ userEmail: useremail });

      console.log("user", user)

      if (user == null) {
        return res.status(401).json({ message: 'Failed', error: 'Failed' });
      }

      if (user.verifyCode == verifyCode) {  // 6 digit verify code
        await User.findByIdAndUpdate(user._id, { signupComplete: true });
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: '6h' });
        return res.status(201).json({ message: 'Succeed', user: user, token: token });
      }
      else {
        return res.status(401).json({ message: 'VerifyIncorrect', error: 'VerifyIncorrect' });
      }

    } catch (error) {
      res.status(500).json({ error: 'Error', 'Server Error:': 'Failed' });
    }
  },

  async signNoAuth(req, res) {
    try {
      const { useremail } = req.body;

      const user = await User.findOne({ userEmail: useremail });

      console.log("user", user)

      if (user == null) {
        return res.status(401).json({ message: 'Failed', error: 'Failed' });
      }
      
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: '6h' });
      return res.status(201).json({ message: 'Signup succeed', user: user, token: token });
    } catch (error) {
      res.status(500).json({ error: 'Error', 'Server Error:': 'Failed' });
    }
  },

  async signNoAuth_PhoneChange(req, res) {
    try {
      const { useremail, phoneNumber } = req.body;

      const user = await User.findOne({ userEmail: useremail });

      console.log("user", user)

      if (user == null) {
        return res.status(401).json({ message: 'Failed', error: 'Failed' });
      }
      
      const phoneUser = await User.findOne({ phoneNumber: phoneNumber });
      if (phoneUser != null) {
        return res.status(401).json({ message: 'Phone already exists.', error: 'Phone already exists.' });
      }

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: '6h' });
      return res.status(201).json({ message: 'Signup succeed', user: user, token: token });
    } catch (error) {
      res.status(500).json({ error: 'Error', 'Server Error:': 'Failed' });
    }
  },


async resendVerifyCode(req, res) {
    try {
        const { useremail } = req.body;

        const user = await User.findOne({ userEmail: useremail });

        console.log("user", user);

        if (user == null) {
            return res.status(401).json({ message: `InvalidEmail`, error: 'Your email is not existed' });
        }

        const verifyCode = parseInt(Math.random() * 899999) + 100000;

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: '6h' });


        await User.findByIdAndUpdate(user._id, {
            verifyCode: verifyCode
        });

        
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS 
            }
        });

        
        const mailOptions = {
            from: '"Monegliseci Team" <no-reply@monegliseci.com>', 
            to: useremail, 
            subject: "Verification Code", 
            html: `<h1> Hi </h1>
                   Please enter the following verification code to verify this attempt. <br/>
                   <h2> ${verifyCode} </h2>
                   Don't recognize this signup attempt? 
                   Regards,
                   The Monegliseci Team` 
        };

        await transporter.sendMail(mailOptions);

        res.status(201).json({ message: 'VerifyResent', token: token });
    } catch (error) {
        console.log('Failed', error);
        res.status(500).json({ error: 'Error', 'Server Error:': 'Failed' });
    }
},

  async forgotPassword(req, res) {
    try {
      const { useremail} = req.body;
      
      const user = await User.findOne({ userEmail: useremail });

      if (user == null) {
        return res.status(401).json({ message:  `InvalidEmail`, error: 'Failed' });
      }

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: '6h' });
      const verifyCode = parseInt(Math.random() * 899999) + 100000;

      await User.findByIdAndUpdate(user._id, {
        verifyCode: verifyCode
      });

      
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS 
        }
    });

    const mailOptions = {
        from: '"Monegliseci Team" <no-reply@monegliseci.com>', 
        to: useremail, 
        subject: "Verification Code", 
        html: `<h1> Hi </h1>
               Please enter the following verification code to verify this attempt. <br/>
               <h2> ${verifyCode} </h2>
               Don't recognize this signup attempt? 
               Regards,
               The Monegliseci Team` 
    };

    await transporter.sendMail(mailOptions);

    // Save the verification code to the user's record (or handle it as needed)
    user.resetPasswordToken = verifyCode;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    res.status(200).json({ message: 'Verification code sent to email' });
  } catch (error) {
    console.error('Error sending verification code:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to send verification code' });
}
  },

  async resetPassword(req, res) {
    try {
      const { stateEmailorPhone, phoneNumber, useremail, password} = req.body;
      console.log('password', password);
    
      let user;
      if (stateEmailorPhone == 0) {
        user = await User.findOne({ userEmail: useremail });
        if (user == null) {
          return res.status(401).json({ message: `InvalidEmail`, error: 'Failed' });
        }
      } else if(stateEmailorPhone == 1) {
        user = await User.findOne({ phoneNumber: phoneNumber });
        if (user == null) {
          return res.status(401).json({ message: `PhoneOwnerdoesntexist`, error: 'Failed' });
        }
      } else {
        return res.status(401).json({ message: `Failed`, error: 'Failed' });
      }

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: '6h' });
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await User.findByIdAndUpdate(user._id, {
        password: hashedPassword
      });

      res.status(201).json({ message: 'Succeed', user: newUser, token: token });
    } catch (error) {
      console.log('Failed');
      res.status(500).json({ error: 'Error', 'Server Error:': 'Failed' });
    }
  },

  async checkSendcode(req, res) {
    try {

      const { emailorphone } = req.body;

      const user = await User.findOne({ $and: [
        {
          phoneNumber: emailorphone
        },
        { status: true }
      ]});

      console.log(user)
      if (!user) {
        return res.status(401).json({ message: `PhoneOwnerdoesntexist`, status: 'Failed' });
      }

      return res.status(200).json({ message: 'Succeed'});
    } catch (error) {
      res.status(500).json({ error: 'Error', 'Server Error:': 'Failed' });
    }
  },

  async signin(req, res) {
    try {

      const { useremail, password } = req.body;

      const user = await User.findOne({ $and: [
        {
          $or: [
            { userEmail: { $regex: new RegExp(useremail, 'i') } },
            { phoneNumber: { $regex: new RegExp(useremail, 'i') } }
          ]
        },
        { status: true }
      ]});

      console.log(user)
      if (!user) {
        return res.status(401).json({ message: `EnterValidEmailorPhone`, status: 'Failed' });
      }

      
      const isPasswordValid = await bcrypt.compare(password, user.password);

      console.log(isPasswordValid)

      if (!isPasswordValid) {
        return res.status(401).json({ message: 'PasswordIncorrect', status: 'Failed' });
      }
      
      if (!user.signupComplete) {
        return res.status(401).json({ message: 'User needs to complete verification', error: 'Incomplete signup' });
      }

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: '6h' });

      res.status(200).json({ message: 'Succeed', user: user, token: token });
    } catch (error) {
      res.status(500).json({ error: 'Error', 'Server Error:': 'Failed' });
    }
  },

  async signinWithGoogle(req, res) {
    try {
      console.log('--------------SigninWithGoogle---------');
      const { useremail } = req.body;
      const user = await User.findOne({ $and: [
        {
          userEmail: { $regex: new RegExp(useremail, 'i') } 
        },
        { status: true }
      ]});

      console.log(user)
      if (!user) {
        return res.status(401).json({ message: `Userdoesntexist`, status: 'Failed' });
      }

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: '6h' });
      res.status(200).json({ message: 'Succeed', user: user, token: token });
    } catch (error) {
      res.status(500).json({ error: 'Error', 'Server Error:': 'Failed' });
    }
  },

  async signinWithFacebook(req, res) {
    try {
      const { useremail } = req.body;
      const user = await User.findOne({ $and: [
        {
          userEmail: { $regex: new RegExp(useremail, 'i') } 
        },
        { status: true }
      ]});

      console.log(user)
      if (!user) {
        return res.status(401).json({ message: `Userdoesntexist`, status: 'Failed' });
      }

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: '6h' });
      res.status(200).json({ message: 'Succeed', user: user, token: token });
    } catch (error) {
      res.status(500).json({ error: 'Error', 'Server Error:': 'Failed' });
    }
  },

  async signinAdmin(req, res) {
    try {

      const { useremail, password } = req.body;

      const user = await User.findOne(
        { $and: [
          {
            $or: [
              { userEmail: { $regex: new RegExp(useremail, 'i') } },
              { phoneNumber: { $regex: new RegExp(useremail, 'i') } }
            ]
          },
          {
            $or : [
              { role : "admin" },
              { role : "super" }
            ]
          },
          { status: true }
        ]}
      );

      console.log(user)
      if (!user) {
        return res.status(401).json({ message: 'Login Failed', status: 'Failed' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      console.log(isPasswordValid)

      if (!isPasswordValid) {
        return res.status(401).json({ message: 'PasswordIncorrect', status: 'Failed' });
      }

      const permission = await Role.findOne({userId: user._id});
      if (!permission) {
        permission = await Role.create({
            userId: user._id,
            churchPermission: true,
            notificationPermission: true,
            transactionPermission: true
        });
    }
      const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET_KEY, { expiresIn: '6h' });

      res.status(200).json({ message: 'Succeed', user: user, token: token, permission: permission });
    } catch (error) {
      res.status(500).json({ error: 'Error', 'Server Error:': 'Failed' });
    }
  },

  async checkPhoneNumber(req, res) {
    try {
      const {userEmail, phoneNumber} = req.body;
      const phoneUser = await User.findOne({ phoneNumber: phoneNumber });
      const user = await User.findOne({ userEmail: userEmail });
      if (user == null) {
        res.status(500).json({ error: `InvalidEmail`, 'Server Error:': 'Failed' });
      }

      if (phoneUser != null) {
        res.status(500).json({ error: 'PhoneExists', 'Server Error:': 'Failed' });
      } else {
        const permission = await Role.findOne({userId: user._id});
        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET_KEY, { expiresIn: '6h' });
        res.status(200).json({ message: 'Succeed', user: user, token: token, permission: permission });
      }
    } catch (error) {
      res.status(500).json({ error: 'Error', 'Server Error:': 'Failed' });
    }
  },

  async updateProfile(req, res) {
    try {
        const { username, useremail, phonenumber, birth, language, address, church, avatarurl, status, role } = req.body;

        console.log(username, useremail, phonenumber, birth, language, address, church, avatarurl);
        
        // Find the user by email
        const user = await User.findOne({ userEmail: useremail });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update the user details
        const updateUser = await User.findByIdAndUpdate(user._id, {
            userName: username,
            userEmail: useremail,
            phoneNumber: phonenumber,
            birth: new Date(birth),
            language: language,
            address: address,
            church: church,
            avatarUrl: avatarurl,
            status: status,
            role: role
        });

        // Handle Role logic
        if (role === 'admin') {
            const existingRole = await Role.findOne({ userId: user._id });

            if (existingRole) {
                // Update permissions if role already exists
                await Role.findByIdAndUpdate(existingRole._id, {
                    churchPermission: true,
                    notificationPermission: true,
                    transactionPermission: true
                });
            } else {
                // Create a new role if it doesn't exist
                await Role.create({
                    userId: user._id,
                    churchPermission: true,
                    notificationPermission: true,
                    transactionPermission: true
                });
            }
        } else {
            // Delete the role if the user is not an admin
            await Role.deleteOne({ userId: user._id });
        }

        // Fetch the updated user info
        const userInfo = await User.findOne({ userEmail: useremail });

        console.log(userInfo);

        // Send a success response
        res.status(200).json({ message: 'Profile updated', user: userInfo });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Server Error', message: 'Failed to update profile' });
    }
},
  async updatePassword(req, res) {
    try {
      const { useremail, oldpassword, newpassword, GoogleorFacebook } = req.body;
      const user = await User.findOne({ userEmail: useremail });

      const isPasswordValid = await bcrypt.compare(oldpassword, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Error', message: "PasswordIncorrect" });
      }

      const hashedPassword = await bcrypt.hash(newpassword, 10);
      let updateUser;
      if (GoogleorFacebook) {
        // In case of Google Sign or Facebook Sign in 
        updateUser = await User.findByIdAndUpdate(user._id, {
          password: hashedPassword,
          GoogleorFacebook: false
        });
      }
      else {
        updateUser = await User.findByIdAndUpdate(user._id, {
          password: hashedPassword
        });
      }

      res.status(200).json({ message: 'Password updated.', user: updateUser });
    } catch (error) {
      console.log('Failed');
      res.status(500).json({ error: 'Error', 'Server Error:': 'Failed' });
    }
  },
  async getAllUsers(req, res) {
    try {
      console.log('getAllUsers function called');
      const users = await User.find();
      console.log('Users retrieved:', users);

      res.status(200).json({ message: 'User List', users: users });
    } catch (error) {
      console.error('Error retrieving users:', error);
      res.status(500).json({ error: 'Error', 'Server Error:': 'Failed' });
    }
  },
  async getUser(req, res) {
    try {
      const userId = req.params.id;

      const user = await User.findById(userId);

      res.status(200).json({ message: 'Succeed', user: user });
    } catch (error) {
      res.status(500).json({ error: 'Error', 'Server Error:': 'Failed' });
    }
  },
  async deleteUser(req, res) {
    try {
      const userId = req.params.id;

      const user = await User.deleteOne({ _id: userId });

      res.status(200).json({ message: 'User deleted', user: user });
    } catch (error) {
      res.status(500).json({ error: 'Error', 'Server Error:': 'Failed' });
    }
  },

  async getSignGoogleorFacebook(req, res) {
    try {
      const {userEmail} = req.body;

      const user = await User.findOne({ userEmail: userEmail });
      const GoogleorFacebook = user.GoogleorFacebook ?? false;
      res.status(200).json({ message: 'Succeed', GoogleorFacebook: GoogleorFacebook });
    } catch (error) {
      res.status(500).json({ error: 'Error', 'Server Error:': 'Failed' });
    }
  },
  
  async adminGetUsersList (req, res) {
    try {
      const {church} = req.body;
      const churchIds = church.map(item => item.value);

      const users = await User.find ({
        church : {$in : churchIds}
      });

      res.status(200).json({ message: 'User List', users : users});
    } catch (error) {
      res.status(500).json({ error: 'Error', 'Server Error:': 'Failed' });
    }
  }
};