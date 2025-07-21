interface PageTitleProps {
  title: string;
}

export const PageTitle = ({ title }: PageTitleProps) => {
  return (
    <div className="mt-2 mb-8 px-4 flex justify-center items-center">
      <div className="h-0.5 bg-gray-200 flex-1" />
      <h2 className="text-base font-light text-center opacity-30 mx-8">{title}</h2>
      <div className="h-0.5 bg-gray-200 flex-1" />
    </div>
  );
};
