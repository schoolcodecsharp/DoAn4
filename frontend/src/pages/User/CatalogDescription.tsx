// The import records provenance in MoTa to preserve the current database contract.
export default function CatalogDescription({ text }: { text?: string }) {
  return <div className="catalog-description">{(text || 'Nội dung giới thiệu đang được cập nhật.').split('\n').filter(Boolean).map((line, index) => {
    const source = /^Nguồn (?:đối chiếu|bổ sung): (https:\/\/\S+)$/.exec(line)?.[1];
    return <p key={index}>{source ? <a href={source} target="_blank" rel="noreferrer">Xem nguồn thông tin tại website đơn vị</a> : line}</p>;
  })}</div>;
}
