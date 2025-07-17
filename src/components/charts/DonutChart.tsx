import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface DonutChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
    totalBobot?: number;
    totalAspek?: number;
  }>;
  title?: string;
  tooltipType?: 'bobot' | 'aspek';
}

export const DonutChart = ({ data, title, tooltipType }: DonutChartProps) => {
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text
        x={x}
        y={y}
        fill="#fff"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={13}
        fontWeight={500}
        fontFamily="inherit"
        style={{ fontFamily: 'inherit', letterSpacing: 0.2 }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="w-full h-80">
      {title && (
        <h3 className="text-lg font-semibold text-center mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={80}
            innerRadius={40}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(_value: number, name: string, props: any) => {
              if (tooltipType === 'aspek') {
                // Untuk Distribusi Status Aspek: tampilkan "Penjelasan: Jumlah aspek"
                // Cek apakah data punya totalAspek (khusus chart status aspek)
                const totalAspek = props?.payload?.value;
                if (typeof totalAspek === 'number' && name) {
                  return `${totalAspek} aspek`;
                }
                // Fallback ke bobot jika bukan chart status aspek
                const totalBobot = props?.payload?.totalBobot;
                return totalBobot !== undefined ? `${totalBobot} bobot` : '';
              } else {
                const totalBobot = props?.payload?.totalBobot;
                return totalBobot !== undefined ? `${totalBobot} bobot` : '';
              }
            }}
            labelFormatter={(name, _payload) => {
              if (tooltipType === 'aspek') {
                return name;
              }
              return `Status: ${name}`;
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};