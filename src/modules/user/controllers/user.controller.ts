// controllers/user.controller.ts
import { Request, Response } from "express";
import * as userService from "../services/user.services";

export const createUser = async (req: Request, res: Response) => {
  try {
    const newUser = await userService.createUser(req.body);
    res.status(201).json(newUser);
  } catch (error: any) {
    res.status(400).json({ message: "Error creating user", error: error.message });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  const users = await userService.getAllUsers();
  res.json(users);
};

export const getUserById = async (req: Request, res: Response) => {
  const user = await userService.getUserById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const updatedUser = await userService.updateUser(req.params.id, req.body);
    if (!updatedUser) return res.status(404).json({ message: "User not found or no updates applied" });
    res.json(updatedUser);
  } catch (error: any) {
    res.status(400).json({ message: "Error updating user", error: error.message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const success = await userService.deleteUser(req.params.id);
  if (!success) return res.status(404).json({ message: "User not found" });
  res.status(204).send();
};
