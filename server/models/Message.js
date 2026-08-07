import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    from_user_id: {type: String, ref: 'User', required: true},
    to_user_id: {type: String, ref: 'User'},
    group_id: {type: String, ref: 'Group', default: null},
    text: {type: String, trim: true},
    message_type: {type: String, enum: ['text', 'image', 'call', 'system']},
    media_url: {type: String},
    delivered: { type: Boolean, default: false },
    seen: {type: Boolean, default: false},
    seen_by: [{ type: String, ref: "User" }],
    call_type: {type: String, enum: ['audio', 'video']},
    call_status: {type: String, enum: ['completed', 'missed', 'declined', 'cancelled']},
    call_duration: {type: Number, default: 0},
    reply_to: {type: String, ref: 'Message', default: null},
    edited: {type: Boolean, default: false},
    edited_at: {type: Date, default: null},
    forwarded: {type: Boolean, default: false},
    deleted_for: [{type: String, ref: 'User'}],
    deleted_for_everyone: {type: Boolean, default: false},
}, {timestamps: true, minimize: false});

messageSchema.index({ from_user_id: 1, to_user_id: 1, createdAt: 1 });
messageSchema.index({ group_id: 1, createdAt: 1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;