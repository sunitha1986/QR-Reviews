import UserModel from './User.js';
import QrModel from './Qr.js';
import ClientModel from './Client.js';
import CategoryModel from './Category.js';
import ReviewModel from './Review.js';
import StatModel from './Stat.js';
import ScanModel from './Scan.js';

export {
  UserModel as User,
  QrModel as Qr,
  ClientModel as Client,
  CategoryModel as Category,
  ReviewModel as Review,
  StatModel as Stat,
  ScanModel as Scan
};

export default {
  User: UserModel,
  Qr: QrModel,
  Client: ClientModel,
  Category: CategoryModel,
  Review: ReviewModel,
  Stat: StatModel,
  Scan: ScanModel
};
