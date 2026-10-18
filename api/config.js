const CLIENT_ID='530904624660-3r2eacr82jaae7bio9r78vlol7mosphh.apps.googleusercontent.com';
export default function handler(req,res){res.setHeader('Cache-Control','public, max-age=3600');return res.status(200).json({googleClientId:process.env.GOOGLE_CLIENT_ID||CLIENT_ID})}
