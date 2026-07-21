export const protect = async (req, res, next) => {
    try {
        const { userId } = await req.auth();
        if(!userId){
            return res.status(401).json({ success: false, message: "Not authenticated" });
        }
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: error.message });
    }
}