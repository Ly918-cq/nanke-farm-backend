require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// 中间件
app.use(cors());
app.use(express.json()); // 解析JSON请求

// 连接MongoDB（先去MongoDB Atlas创建免费集群，获取连接字符串）
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB 连接成功'))
  .catch(err => console.error('MongoDB 连接失败:', err));

// 定义基础模型（用户模型 + 合格证数据模型）
// 用户模型
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true }, // 真实姓名/企业名称
  phone: { type: String, required: true },
  role: { type: String, default: 'user' } // admin/用户
});
const User = mongoose.model('User', UserSchema);

// 合格证数据模型
const CertSchema = new mongoose.Schema({
  certId: { type: String, required: true, unique: true },
  operatorName: { type: String, required: true },
  operatorType: { type: String, required: true },
  operatorAddress: { type: String, required: true },
  operatorPhone: { type: String, required: true },
  productName: { type: String, required: true },
  productVariety: { type: String },
  productQuantity: { type: String, required: true },
  produceDate: { type: String, required: true },
  detectResult: { type: String, required: true },
  promisorName: { type: String, required: true },
  createTime: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // 关联用户
});
const Cert = mongoose.model('Cert', CertSchema);

// 基础接口示例（用户注册）
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, name, phone } = req.body;
    // 密码加密
    const bcrypt = require('bcryptjs');
    const hashedPwd = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPwd, name, phone });
    await user.save();
    res.status(201).json({ success: true, message: '注册成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: '注册失败', error: err.message });
  }
});

// 基础接口示例（保存合格证数据）
app.post('/api/save-cert', async (req, res) => {
  try {
    const certData = req.body;
    const cert = new Cert(certData);
    await cert.save();
    res.status(201).json({ success: true, message: '合格证数据保存成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: '保存失败', error: err.message });
  }
});

// 基础接口示例（统计数据）
app.get('/api/stat', async (req, res) => {
  try {
    // 统计总合格证数量
    const totalCerts = await Cert.countDocuments();
    // 按产品类型统计
    const productStat = await Cert.aggregate([
      { $group: { _id: '$productName', count: { $sum: 1 } } }
    ]);
    res.json({ success: true, data: { totalCerts, productStat } });
  } catch (err) {
    res.status(500).json({ success: false, message: '统计失败', error: err.message });
  }
});

// 静态文件托管（前端页面放在public目录）
app.use(express.static('public'));

// 启动服务
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`服务运行在端口 ${PORT}`));

// Vercel 部署兼容
module.exports = app;
