const uuid = require('uuid');
// const sgMail = require('@sendgrid/mail');
// const Sib = require('sib-api-v3-sdk');
const Sib = require('@getbrevo/brevo');
const bcrypt = require('bcrypt');
require('dotenv').config()


const User = require('../models/user');
const Forgotpassword = require('../models/forgotpassword')

exports.forgotpassword = async(req,res,next)=>{
    try {
        const {email} =req.body ;
        const user = await User.findOne({email});
        // console.log(user);
        if(!user){
             return res.status(404).json('User doesnt exist')
        }
        const id = uuid.v4();
        // console.log(typeof(id))
         const forgotpassword = new Forgotpassword({ active:true , userId:user._id , uuid:id})
            forgotpassword.save();
            console.log(email);
        // console.log(create)
        const client = Sib.ApiClient.instance
        const apiKey = client.authentications['api-key']
        apiKey.apiKey = process.env.SENDINBLUE_KEY ;
        // console.log(process.env.SENDINBLUE_KEY)
        const tranEmailApi = new Sib.TransactionalEmailsApi()

        const sender = {
        	email: 'alkabhardwaj2212@gmail.com',
        	name: 'Alka Bhardwaj',
        }

        const receivers = [
        	{
        		email: email ,
        	},
        ]
        
        console.log('////////////////////////////////')

        await tranEmailApi
	    .sendTransacEmail({
	    	sender,
	    	to: receivers,
	    	subject: "Reset your password ",
	    	textContent: "follow the link to rest password",
	    	htmlContent: `Click on the link below to reset password <br> <a href="http://localhost:3000/password/resetpassword/${id}">Reset password</a>`,
	    })
	    .then((response) => {
            console.log(response)
            return res.status(202).json({message: 'Link to reset password sent to your mail ', sucess: true})
        })
	    .catch(error=>console.log(error))


    } catch (error) {
        return res.json({ message: error, sucess: false });
    }
}

exports.resetpassword = async(req,res,next)=>{

    let  id = req.params.id ;

    try {
        let forgotpasswordrequest = await Forgotpassword.findOne({uuid : id, active: true})
        if(!forgotpasswordrequest){
            return res.status(404).json('User doesnt exist')
        }
        await Forgotpassword.updateOne({id: id}, {isActive: false})
        // await forgotpasswordrequest.save()
        // forgotpasswordrequest.update({ active:false });

        if(forgotpasswordrequest){

            res.status(200).send(`<html>
                                    <script>
                                        function formsubmitted(e){
                                            e.preventDefault();
                                            console.log('called')
                                        }
                                    </script>
                                    <form action="/password/updatepassword/${id}" method="get">
                                        <label for="newpassword">Enter New password</label>
                                        <input name="newpassword" type="password" required></input>
                                        <button>reset password</button>
                                    </form>
                                </html>`
                                )
            res.end();
        }
        else{
            throw new Error('Reset password link not found or expired!!');
        }
        
    } catch(err){
        console.log(err);
        res.status(500).json({success: false, message:err});
    }
}

exports.updatepassword = async(req,res,next)=>{
    const { newpassword } = req.query;
    const id = req.params.resetpasswordid;

    console.log(typeof(newpassword) ) 
    try {
        const resetpasswordrequest  = await Forgotpassword.findOne({uuid : id})
        const user = await User.findById({_id: resetpasswordrequest.userId })
        if(!user){
            return res.status(404).json({ error: 'No user Exists', success: false})
        }

        const saltRounds = 10;
        bcrypt.hash(newpassword, saltRounds, async(err, hash)=>{
            if(err){
                throw new Error(err);
            }
            user.password = hash
            await user.save()
            res.status(201).json({message: 'Successfuly update the new password'})
        });
        

    } catch (error) {
        return res.status(403).json({ error, success: false } )
    }
}