import User from "../models/User.js";

export const isConnected = async (myId, otherId) => {
  const me = await User.findById(myId);
  return !!me?.connections?.includes(otherId);
};