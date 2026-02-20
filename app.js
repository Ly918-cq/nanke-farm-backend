require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// 基础配置（解决跨域、解析JSON）
app.use(cors());
app.use(express.json());

// 连接MongoDB（只用免费的MongoDB Atlas）
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB连接成功'))
  .catch(err => console.error('MongoDB连接失败:', err));

// 定义唯一的数据模型（只存合格证信息，不用用户表）
const CertSchema = new mongoose.Schema({
  certId: { type: String, required: true, unique: true }, // 合格证编号
  operatorName: { type: String, required: true }, // 主体名称
  operatorType: { type: String, required: true }, // 主体类型
  operatorAddress: { type: String, required: true }, // 生产地址
  operatorPhone: { type: String, required: true }, // 联系电话
  productName: { type: String, required: true }, // 产品名称
  productQuantity: { type: String, required: true }, // 数量
  produceDate: { type: String, required: true }, // 日期
  detectResult: { type: String, required: true }, // 检测结果
  promisorName: { type: String, required: true }, // 承诺人
  createTime: { type: String, required: true }, // 生成时间
});
const Cert = mongoose.model('Cert', CertSchema);

// 接口1：保存合格证数据（核心）
app.post('/api/save-cert', async (req, res) => {
  try {
    const certData = req.body;
    // 先检查是否已存在该编号
    const exists = await Cert.findOne({ certId: certData.certId });
    if (exists) {
      return res.json({ success: true, message: '该合格证已保存过' });
    }
    const cert = new Cert(certData);
    await cert.save();
    res.json({ success: true, message: '数据保存成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: '保存失败', error: err.message });
  }
});

// 接口2：获取统计数据（简单版）
app.get('/api/stat', async (req, res) => {
  try {
    // 1. 总数量
    const total = await Cert.countDocuments();
    // 2. 按产品名称统计
    const productStat = await Cert.aggregate([
      { $group: { _id: '$productName', count: { $sum: 1 } } }
    ]);
    // 3. 按日期统计（最近7天）
    const dateStat = await Cert.aggregate([
      { $group: { _id: '$produceDate', count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
      { $limit: 7 }
    ]);
    res.json({ success: true, data: { total, productStat, dateStat } });
  } catch (err) {
    res.status(500).json({ success: false, message: '统计失败', error: err.message });
  }
});

// 接口3：获取所有合格证数据（导出用）
app.get('/api/certs', async (req, res) => {
  try {
    const certs = await Cert.find().sort({ createTime: -1 });
    res.json({ success: true, data: certs });
  } catch (err) {
    res.status(500).json({ success: false, message: '获取数据失败', error: err.message });
  }
});

// 托管前端页面（把index.html放public文件夹）
app.use(express.static('public'));

// Vercel部署兼容
module.exports = app;
