import { Request, Response } from 'express';

// Stub controller for missing endpoints
export const stubController = {
  getAll: async (req: Request, res: Response) => {
    res.json({ message: 'Not implemented', data: [] });
  },
  
  getOne: async (req: Request, res: Response) => {
    res.json({ message: 'Not implemented', data: null });
  },
  
  create: async (req: Request, res: Response) => {
    res.status(201).json({ message: 'Not implemented', data: req.body });
  },
  
  update: async (req: Request, res: Response) => {
    res.json({ message: 'Not implemented', data: req.body });
  },
  
  delete: async (req: Request, res: Response) => {
    res.status(204).send();
  }
};

// Export aliases for missing controllers
export const analyticsController = stubController;
export const batchController = stubController;
export const companyController = stubController;
export const fileController = stubController;
export const syncController = stubController;
export const tokenController = stubController;
export const webhookController = stubController;