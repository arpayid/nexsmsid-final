type SkipToContentProps = {
  targetId?: string;
};

export function SkipToContent({ targetId = "main-content" }: SkipToContentProps) {
  return (
    <a className="skip-to-content" href={`#${targetId}`}>
      Lewati ke konten utama
    </a>
  );
}
