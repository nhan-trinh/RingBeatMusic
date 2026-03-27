import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';

export const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Update request properties with validated data (e.g., stripping unknown keys, executing coercions)
      if (validatedData.body) req.body = validatedData.body;
      if (validatedData.query) req.query = validatedData.query as Record<string, any>;
      if (validatedData.params) req.params = validatedData.params as Record<string, string>;

      next();
    } catch (error) {
      next(error); // error.middleware.ts will catch ZodError and format it to 400
    }
  };
};
