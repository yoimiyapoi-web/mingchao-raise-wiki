export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <p>
          本站为玩家制作的粉丝向资料站,数据与图片来自
          <a href="https://wiki.kurobbs.com/mc/home" target="_blank" rel="noreferrer">
            库街区·鸣潮 Wiki
          </a>
          公开接口,内容版权归库洛游戏所有,仅供学习交流。
        </p>
        <p className="footer-meta">
          非官方站点 · 数据为构建时快照,可用 <code>npm run refresh-data</code> 更新
        </p>
      </div>
    </footer>
  )
}
