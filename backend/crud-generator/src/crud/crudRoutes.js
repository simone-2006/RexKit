import { Router } from 'express';
import { getTableMeta } from '../database/schemaReader.js';
import { attachTable, sanitizeBody } from '../middleware/validation.js';
import * as controller from './crudController.js';

export function generateCrud(tableName) {
    const router = Router();

    router.use(attachTable(tableName));
    router.use(async (req, res, next) => {
        try {
            req.crudColumns = await getTableMeta(tableName);
            next();
        } catch (err) {
            next(err);
        }
    });
    router.use(sanitizeBody);

    router.get('/', controller.list);
    router.get('/schema', controller.getSchema);
    router.get('/:id', controller.getById);
    router.post('/', controller.create);
    router.put('/:id', controller.update);
    router.patch('/:id', controller.update);
    router.delete('/:id', controller.remove);

    return router;
}
