import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
    // todo: I don't care what content it have but I just created to avoid typo in future
    // in another models I have used user model as "User" so here I just exported in that way
})

const User = mongoose.model("User", userSchema)
export default User