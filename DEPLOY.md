# 🚀 小新粉丝圈 - Vercel 部署教程（超详细版）

> 这份教程会手把手教你，从零开始把网站部署到 Vercel。
> 每一步都有详细说明，跟着做就行！

---

## 📋 你需要准备的东西

| 需要什么 | 去哪里弄 | 花钱吗 |
|---------|---------|--------|
| GitHub 账号 | https://github.com/signup | 免费 |
| Vercel 账号 | https://vercel.com/signup | 免费 |
| 电脑上装了 Git | https://git-scm.com/downloads | 免费 |

> 💡 Vercel 可以直接用 GitHub 账号登录，更方便！

---

## 第一步：注册 GitHub 账号

> 如果你已经有 GitHub 账号，跳过这一步

1. 打开浏览器，访问 **https://github.com/signup**
2. 填写用户名（英文，如 `xiaoxin2025`）
3. 填写邮箱（你的常用邮箱）
4. 设置密码
5. 点击 **Create account**
6. 去邮箱找到验证码，输入验证
7. 完成注册

---

## 第二步：在 GitHub 创建仓库

> 仓库 = 存放代码的地方

1. 登录 GitHub 后，点击右上角的 **"+"** 号
2. 点击 **"New repository"**（新建仓库）
3. 填写信息：
   - **Repository name**: 输入 `xiaoxin-fan-site`
   - **Description**: 输入 `小新粉丝圈`（可选）
   - **Public 还是 Private**: 选 **Private**（私有，别人看不到你的代码）
4. ❌ **不要**勾选 "Add a README file"
5. ❌ **不要**选择 .gitignore 和 license
6. 点击绿色的 **"Create repository"** 按钮
7. 创建成功后，你会看到一个页面，上面有仓库地址，类似：
   ```
   https://github.com/你的用户名/xiaoxin-fan-site.git
   ```
   📝 **记下这个地址，后面要用！**

---

## 第三步：安装 Git

> 如果你已经装过 Git，跳过这一步
> 在终端/命令行输入 `git --version`，如果显示版本号就是已安装

### Windows:
1. 打开 https://git-scm.com/download/win
2. 下载安装包，双击安装
3. 一路点 **Next**（默认选项就行）
4. 安装完成后，右键桌面会出现 **"Git Bash Here"** 选项

### Mac:
1. 打开终端（Terminal）
2. 输入 `git --version`
3. 如果没装会自动弹出安装提示，点安装就行

---

## 第四步：下载项目代码到你的电脑

你需要把当前项目的代码下载到你的电脑上。

### 方法 A：如果项目在你自己电脑上
直接在你电脑的终端/命令行里操作。

### 方法 B：如果需要从当前环境拷贝
把整个项目文件夹复制到你的电脑上即可。

---

## 第五步：把代码上传到 GitHub

### 5.1 打开终端

- **Windows**: 右键桌面 → 点击 **"Git Bash Here"**
- **Mac**: 打开 **终端 (Terminal)**

### 5.2 进入项目文件夹

```bash
cd 你的项目路径
```

例如：
```bash
cd Desktop/xiaoxin-fan-site
```

> 💡 如果你不知道项目路径，可以把文件夹拖到终端窗口里，路径会自动填入

### 5.3 初始化 Git

```bash
git init
```

你会看到类似输出：
```
Initialized empty Git repository in /xxx/xiaoxin-fan-site/.git/
```

### 5.4 添加所有文件

```bash
git add .
```

> 💡 注意 `.` 前面有个空格！这个命令的意思是"添加所有文件"

### 5.5 提交代码

```bash
git commit -m "小新粉丝圈初始版本"
```

### 5.6 关联 GitHub 仓库

```bash
git remote add origin https://github.com/你的用户名/xiaoxin-fan-site.git
```

> ⚠️ 把 `你的用户名` 换成你实际的 GitHub 用户名！
>
> 例如：`git remote add origin https://github.com/xiaoxin2025/xiaoxin-fan-site.git`

### 5.7 推送代码到 GitHub

```bash
git branch -M main
git push -u origin main
```

> 第一次推送时，会弹出登录窗口：
> - **Windows**: 会打开浏览器让你登录 GitHub
> - **Mac**: 可能要求输入 GitHub 用户名和密码（密码要用 Personal Access Token）
>
> 🔑 如果要求输入密码，你需要：
> 1. 打开 https://github.com/settings/tokens
> 2. 点击 **"Generate new token"** → **"Generate new token (classic)"**
> 3. Note 填 `git-push`，勾选 **repo** 权限
> 4. 点击 **Generate token**
> 5. 复制生成的 token（以 `ghp_` 开头），当作密码粘贴

推送成功后，打开 `https://github.com/你的用户名/xiaoxin-fan-site` 应该能看到所有代码！

---

## 第六步：注册 Vercel 并导入项目

### 6.1 注册 Vercel

1. 打开 **https://vercel.com/signup**
2. 点击 **"Continue with GitHub"**（用 GitHub 账号登录）
3. 授权 Vercel 访问你的 GitHub
4. 完成注册

### 6.2 导入项目

1. 登录 Vercel 后，你会看到 Dashboard（仪表板）
2. 点击 **"Add New..."** → **"Project"**
3. 在 "Import Git Repository" 页面，找到你刚才创建的 `xiaoxin-fan-site` 仓库
4. 点击仓库右边的 **"Import"** 按钮

### 6.3 配置项目（先不要部署！）

在 "Configure Project" 页面：

1. **Project Name**: 可以改成 `xiaoxin-fan-site` 或保持默认
2. **Framework Preset**: 确认显示 **Next.js**（Vercel 会自动检测）
3. **Build and Output Settings**:
   - Build Command: 保持默认（自动检测）
   - Output Directory: 保持默认
4. **Environment Variables**: 暂时不要添加，我们下一步再搞

> ⚠️ **先不要点击 Deploy！** 我们需要先配置数据库

---

## 第七步：创建数据库

### 7.1 在 Vercel 创建 Postgres 数据库

1. 在 Vercel 左侧菜单，点击 **"Storage"**（存储）
2. 点击 **"Create Database"**（创建数据库）
3. 选择 **"Postgres"**（Neon Postgres）
4. 点击 **"Continue"**
5. 数据库会显示在列表中

### 7.2 连接数据库到项目

1. 点击你刚创建的数据库
2. 找到 **"Linked Projects"**（关联项目）区域
3. 点击 **"Link to Project"**
4. 选择你的 `xiaoxin-fan-site` 项目
5. Vercel 会自动添加 `DATABASE_URL` 环境变量 ✅

> 💡 这一步非常关键！它把数据库和你的网站项目关联起来了

---

## 第八步：添加环境变量

1. 在 Vercel 项目页面，点击顶部的 **"Settings"** 标签
2. 在左侧菜单点击 **"Environment Variables"**
3. 你会看到已经有了 `DATABASE_URL`（上一步自动添加的）
4. 现在添加其他变量：

### 添加 NEXTAUTH_SECRET

- **Name**: 输入 `NEXTAUTH_SECRET`
- **Value**: 你需要生成一个随机密钥

**生成密钥的方法：**

方法一：在终端运行
```bash
openssl rand -base64 32
```
会输出类似 `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0=` 的字符串

方法二：如果不会用终端，直接访问 https://generate-secret.vercel.app/32 ，复制页面显示的字符串

- 把生成的字符串粘贴到 **Value** 框中
- 点击 **"Add"**

### 添加 NEXTAUTH_URL

- **Name**: 输入 `NEXTAUTH_URL`
- **Value**: 输入你的 Vercel 项目 URL，格式为 `https://你的项目名.vercel.app`
  - 例如：`https://xiaoxin-fan-site.vercel.app`
  - 如果不确定 URL，可以先部署，拿到 URL 后再回来添加
- 点击 **"Add"**

---

## 第九步：部署！🎉

1. 回到 Vercel 项目页面
2. 点击顶部的 **"Deployments"** 标签
3. 如果之前没部署过，点击 **"Deploy"** 按钮
4. 如果之前配置时部署过，点击最新部署右侧的 **"..."** → **"Redeploy"**

等待 1-3 分钟，你会看到：
- ⬛ 构建日志滚动（可以看到构建进度）
- ✅ 构建完成后，出现 🎉 庆祝动画

部署成功后，你会看到你的网站 URL，类似：
```
https://xiaoxin-fan-site.vercel.app
```

点击这个链接，你的网站就上线了！🎊

---

## 第十步：初始化数据

网站刚上线时是空的，需要创建示例数据：

1. 在浏览器地址栏输入：
   ```
   https://你的项目名.vercel.app/api/seed
   ```
2. 按回车访问
3. 如果看到 `{"message":"Seed completed successfully!"}` 就说明成功了！
4. 回到你的网站首页刷新，就能看到内容了

---

## 第十一步：自定义域名（可选）

> 如果你觉得 `xiaoxin-fan-site.vercel.app` 够用了，可以跳过
> 如果你想用 `xiaoxin.fun` 这样的域名，继续看

### 11.1 购买域名

推荐平台：
- **Namesilo**: https://namesilo.com （便宜，.fun 域名约 ¥7/年）
- **腾讯云**: https://dnspod.cn （国内，.cn 域名约 ¥29/年）
- **阿里云**: https://wanwang.aliyun.com

### 11.2 在 Vercel 绑定域名

1. 在 Vercel 项目 → **Settings** → **Domains**
2. 在输入框中输入你的域名，如 `xiaoxin.fun`
3. 点击 **"Add"**
4. Vercel 会显示需要添加的 DNS 记录，类似：

   | 类型 | 名称 | 值 |
   |------|------|-----|
   | CNAME | @ | cname.vercel-dns.com |

### 11.3 到域名商添加 DNS 记录

1. 登录你买域名的网站（Namesilo/腾讯云/阿里云）
2. 找到 **DNS 管理** 或 **域名解析** 设置
3. 添加 Vercel 要求的记录：
   - 类型选 **CNAME**
   - 主机记录填 `@`
   - 记录值填 `cname.vercel-dns.com`
4. 保存

### 11.4 等待生效

- DNS 生效通常需要几分钟到几小时
- 生效后 Vercel 会自动配置 HTTPS（免费！）
- 你就可以用自定义域名访问了！

---

## 📌 以后怎么更新网站？

每次修改代码后，只需要 3 步：

```bash
# 1. 进入项目目录
cd 你的项目路径

# 2. 提交修改
git add .
git commit -m "更新说明"

# 3. 推送到 GitHub
git push
```

推送后 Vercel 会在 1-2 分钟内自动完成重新部署！

---

## ❓ 常见问题

### Q: 推送代码时提示 "fatal: not a git repository"
```bash
# 先初始化 git
git init
git add .
git commit -m "初始化"
git remote add origin https://github.com/你的用户名/xiaoxin-fan-site.git
git push -u origin main
```

### Q: 推送代码时要求输入密码
GitHub 不再支持密码登录，需要用 Personal Access Token：
1. 打开 https://github.com/settings/tokens
2. "Generate new token (classic)"
3. 勾选 **repo** 权限
4. 生成后复制 token，当作密码使用

### Q: 部署失败，Build Log 显示错误
1. 在 Vercel → Deployments → 点击失败的部署
2. 查看 Build Log 里的红色错误信息
3. 最常见的问题是环境变量没配好，检查 Settings → Environment Variables

### Q: 网站打开了但是数据是空的
访问 `https://你的域名/api/seed` 初始化数据

### Q: 登录功能不工作
检查环境变量：
- `NEXTAUTH_SECRET` 是否已添加
- `NEXTAUTH_URL` 是否正确（必须是 https:// 开头）

### Q: 数据库连接失败
- 确认已在 Vercel Storage 中创建了 Postgres 数据库
- 确认数据库已 Link 到你的项目
- 确认 `DATABASE_URL` 环境变量存在

---

## 🆘 还是不行？复制错误信息来问我

如果哪一步卡住了，把**错误信息**或**截图**发给我，我帮你解决！
