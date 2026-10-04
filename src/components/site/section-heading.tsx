/** Tiêu đề lớn viết hoa + dòng chữ nghiêng bên dưới, căn giữa. */
export function SectionHeading({ title, italic, as: Tag = "h2" }: { title: string; italic: string; as?: "h1" | "h2" }) {
  return (
    <div className="text-center">
      <Tag className="caps-display text-3xl md:text-5xl">{title}</Tag>
      <p className="mt-3 font-display text-2xl text-gold italic md:text-3xl">{italic}</p>
    </div>
  );
}
