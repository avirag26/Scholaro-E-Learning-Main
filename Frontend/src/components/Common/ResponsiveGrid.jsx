const ResponsiveGrid = ({
  children,
  className = '',
  cols = {
    default: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 4
  },
  gap = 'gap-4 sm:gap-6'
}) => {
  const gridClasses = `grid ${gap} ${className}`;

  const responsiveClasses = [
    `grid-cols-${cols.default}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    cols['2xl'] && `2xl:grid-cols-${cols['2xl']}`
  ].filter(Boolean).join(' ');

  return (
    <div className={`${gridClasses} ${responsiveClasses}`}>
      {children}
    </div>
  );
};

export default ResponsiveGrid;