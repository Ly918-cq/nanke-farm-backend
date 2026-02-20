const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 3000;

// 你的微信公众号配置
const WECHAT_CONFIG = {
  appId: 'wx607cc7e5407f659c',
  appSecret: process.env.WECHAT_APPSECRET,
  accessTokenUrl: 'https://api.weixin.qq.com/cgi-bin/token'
};

// 仅允许你的前端 GitHub Pages 访问，防止跨域报错
app.use(cors({
  origin: 'https://ly918-cq.github.io',
  methods: ['POST'],
  credentials: true
}));

// 解析前端提交的 JSON 数据
app.use(express.json());

// 核心接口：接收前端合格证数据，同步到微信公众号
app.post('/api/wechat/save-cert', async (req, res) => {
  try {
    // 获取微信公众号临时凭证 Access_Token
    const tokenRes = await axios.get(WECHAT_CONFIG.accessTokenUrl, {
      params: {
        grant_type: 'client_credential',
        appid: WECHAT_CONFIG.appId,
        secret: WECHAT_CONFIG.appSecret
      }
    });
    const accessToken = tokenRes.data.access_token;

    // 获取前端提交的合格证数据
    const certData = req.body;

    // 调用微信 API，将数据保存到公众号素材库（后台可查）
    const wechatRes = await axios.post(
      `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${accessToken}&type=text`,
      {
        title: `纳科农品合格证_${certData.certId}`,
        content: JSON.stringify(certData, null, 2)
      }
    );

    // 返回成功结果给前端
    res.json({
      success: true,
      msg: '数据同步到微信公众号成功',
      data: wechatRes.data
    });
  } catch (error) {
    // 同步失败不影响前端，返回失败原因
    res.json({
      success: false,
      msg: '微信同步失败：' + (error.response?.data?.errmsg || error.message),
      error: error.message
    });
  }
});

// 适配 Vercel 部署
module.exports = app;
// 启动服务
app.listen(port, () => {
  console.log(`纳科农品后端接口运行在端口：${port}`);
});
