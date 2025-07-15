import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface BarChartProps {
  data: Array<{
    [key: string]: any;
  }>;
  xKey: string;
  yKeys: Array<{
    key: string;
    name: string;
    color: string;
  }>;
  title?: string;
  layout?: 'horizontal' | 'vertical';
}

export const BarChart = ({ data, xKey, yKeys, title, layout = 'vertical' }: BarChartProps) => {
  return (
    <div className="w-full h-80">
      {title && (
        <h3 className="text-lg font-semibold text-center mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart 
          data={data} 
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          layout={layout}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          {layout === 'vertical' ? (
            <>
              <XAxis 
                type="number"
                stroke="hsl(var(--foreground))"
                fontSize={12}
              />
              <YAxis 
                type="category"
                dataKey={xKey} 
                stroke="hsl(var(--foreground))"
                fontSize={12}
                width={100}
              />
            </>
          ) : (
            <>
              <XAxis 
                dataKey={xKey} 
                stroke="hsl(var(--foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--foreground))"
                fontSize={12}
              />
            </>
          )}
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px'
            }}
          />
          <Legend />
          {yKeys.map((yKey) => (
            <Bar
              key={yKey.key}
              dataKey={yKey.key}
              fill={yKey.color}
              name={yKey.name}
              radius={[2, 2, 2, 2]}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};