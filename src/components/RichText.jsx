// 官方富文本内容容器(数据已在抓取阶段做安全清洗与深色适配)
export default function RichText({ html, className = '' }) {
  return <div className={`rich-text ${className}`} dangerouslySetInnerHTML={{ __html: html }} />
}
