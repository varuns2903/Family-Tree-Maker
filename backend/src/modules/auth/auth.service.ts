import { UserModel } from "../users/user.model";
import { hashPassword, verifyPassword } from "../../utils/password";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} from "../../utils/jwt";

const buildAuthResponse = (user: any) => ({
  accessToken: signAccessToken(user.id),
  refreshToken: signRefreshToken(user.id),
  user: {
    id: user.id,
    name: user.name,
    email: user.email
  }
});

export const registerUser = async (
  name: string,
  email: string,
  password: string
) => {
  const existing = await UserModel.findOne({ email });
  if (existing) {
    throw { statusCode: 409, message: "Email already registered" };
  }

  const passwordHash = await hashPassword(password);

  const user = await UserModel.create({
    name,
    email,
    passwordHash
  });

  return buildAuthResponse(user);
};

export const loginUser = async (
  email: string,
  password: string
) => {
  const user = await UserModel.findOne({ email });
  if (!user) {
    throw { statusCode: 401, message: "Invalid credentials" };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw { statusCode: 401, message: "Invalid credentials" };
  }

  return buildAuthResponse(user);
};

export const getCurrentUser = async (userId: string) => {
  const user = await UserModel.findById(userId).select(
    "_id name email"
  );

  if (!user) {
    throw { statusCode: 404, message: "User not found" };
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email
  };
};

export const refreshTokens = async (refreshToken: string) => {
  const payload = verifyRefreshToken(refreshToken);

  return {
    accessToken: signAccessToken(payload.sub),
    refreshToken: signRefreshToken(payload.sub)
  };
};

export const logoutUser = async () => {
  // Stateless logout for now
  return;
};
