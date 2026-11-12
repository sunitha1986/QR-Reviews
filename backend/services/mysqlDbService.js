/**
 * MySQL Database Service Facade
 * Delegates to individual Entity Models (User, Qr, Client, Category, Review, Stat)
 * Maintained for backward compatibility across scripts and existing callers.
 */
import { User, Qr, Client, Category, Review, Stat } from '../models/index.js';
import { generateSlug } from '../utils/slug.js';

const mysqlDbService = {
  generateSlug,

  // Users
  findUserByUsername: (username) => User.findByUsername(username),

  // QR Codes
  getAllQrs: () => Qr.getAll(),
  getUnassignedQrs: () => Qr.getUnassigned(),
  findQrByQrId: (qrId) => Qr.findByQrId(qrId),
  findQrByQrIdOrSlug: (identifier) => Qr.findByQrIdOrSlug(identifier),
  insertQr: (qr) => Qr.insert(qr),
  insertBatchQrs: (qrsList) => Qr.insertBatch(qrsList),
  updateQrAssignment: (qrId, data) => Qr.updateAssignment(qrId, data),
  calculateNextQrSequence: () => Qr.calculateNextSequence(),

  // Clients
  getAllClients: () => Client.getAll(),
  findClientById: (clientId) => Client.findById(clientId),
  findClientByIdOrQr: (idOrQr) => Client.findByIdOrQr(idOrQr),
  findClientByIdOrQrOrSlug: (identifier) => Client.findByIdOrQrOrSlug(identifier),
  findClientByUsernameOrPhone: (userOrPhone) => Client.findByUsernameOrPhone(userOrPhone),
  insertClient: (client) => Client.insert(client),
  updateClient: (clientId, fields) => Client.update(clientId, fields),

  // Reviews
  insertReview: (review) => Review.insert(review),
  getReviewsByClientId: (clientId, qrId) => Review.getByClientId(clientId, qrId),
  getAllReviews: () => Review.getAll(),

  // Stats
  getSystemStats: () => Stat.getSystemStats(),

  // Categories
  getAllCategories: () => Category.getAll(),
  findCategoryById: (id) => Category.findById(id),
  findCategoryByName: (name) => Category.findByName(name),
  insertCategory: (category) => Category.insert(category),
  updateCategory: (id, fields) => Category.update(id, fields),
  deleteCategory: (id) => Category.delete(id)
};

export { mysqlDbService };
export default mysqlDbService;
