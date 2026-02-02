import { Component, Input, OnChanges, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { Sale } from '../../core/models';

Chart.register(...registerables);

@Component({
  selector: 'app-sales-charts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- Sales Trend Chart -->
      <div class="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Sales Trend</h3>
        <canvas #salesTrendChart></canvas>
      </div>
      
      <!-- Payment Methods Distribution -->
      <div class="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
        <div class="flex justify-center">
          <canvas #paymentChart style="max-height: 300px;"></canvas>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- Revenue by Hour -->
      <div class="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Sales by Hour</h3>
        <canvas #hourlyChart></canvas>
      </div>
      
      <!-- Top Products -->
      <div class="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Top 10 Products by Revenue</h3>
        <canvas #topProductsChart></canvas>
      </div>
    </div>

    <!-- Sales Person Performance -->
    <div class="bg-white p-6 rounded-xl shadow-md border border-gray-100 mb-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Sales Person Performance</h3>
      <canvas #salesPersonChart></canvas>
    </div>

    <!-- Daily Sales Overview -->
    <div class="bg-white p-6 rounded-xl shadow-md border border-gray-100 mb-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Daily Sales & Revenue Overview</h3>
      <canvas #dailyOverviewChart></canvas>
    </div>
  `
})
export class SalesChartsComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() sales: Sale[] = [];
  @Input() products: any[] = [];
  
  @ViewChild('salesTrendChart') salesTrendCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('paymentChart') paymentCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('hourlyChart') hourlyCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('topProductsChart') topProductsCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('salesPersonChart') salesPersonCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('dailyOverviewChart') dailyOverviewCanvas!: ElementRef<HTMLCanvasElement>;

  private charts: Chart[] = [];

  ngAfterViewInit(): void {
    // Wait a tick for canvas elements to be ready
    setTimeout(() => {
      this.createCharts();
    }, 0);
  }

  ngOnChanges(): void {
    if (this.salesTrendCanvas) {
      this.updateCharts();
    }
  }

  private createCharts(): void {
    this.createSalesTrendChart();
    this.createPaymentChart();
    this.createHourlyChart();
    this.createTopProductsChart();
    this.createSalesPersonChart();
    this.createDailyOverviewChart();
  }

  private updateCharts(): void {
    this.charts.forEach(chart => chart.destroy());
    this.charts = [];
    this.createCharts();
  }

  private createSalesTrendChart(): void {
    const ctx = this.salesTrendCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const dailyData = this.getDailySalesData();

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: dailyData.labels,
        datasets: [
          {
            label: 'Revenue (₹)',
            data: dailyData.revenue,
            borderColor: 'rgb(99, 102, 241)',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            tension: 0.4,
            fill: true,
            yAxisID: 'y',
          },
          {
            label: 'Number of Sales',
            data: dailyData.count,
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            fill: true,
            yAxisID: 'y1',
          }
        ]
      },
      options: {
        responsive: true,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.datasetIndex === 0) {
                  label += '₹' + (context.parsed.y || 0).toFixed(2);
                } else {
                  label += context.parsed.y || 0;
                }
                return label;
              }
            }
          }
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Revenue (₹)'
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Number of Sales'
            },
            grid: {
              drawOnChartArea: false,
            },
          },
        }
      }
    };

    this.charts.push(new Chart(ctx, config));
  }

  private createPaymentChart(): void {
    const ctx = this.paymentCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const paymentData = this.getPaymentMethodData();

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: paymentData.labels,
        datasets: [{
          data: paymentData.data,
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(168, 85, 247, 0.8)',
            'rgba(251, 146, 60, 0.8)'
          ],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed;
                const total = context.dataset.data.reduce((a: number, b: any) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ₹${value.toFixed(2)} (${percentage}%)`;
              }
            }
          }
        }
      }
    };

    this.charts.push(new Chart(ctx, config));
  }

  private createHourlyChart(): void {
    const ctx = this.hourlyCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const hourlyData = this.getHourlyData();

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: hourlyData.labels,
        datasets: [{
          label: 'Sales Count',
          data: hourlyData.data,
          backgroundColor: 'rgba(236, 72, 153, 0.8)',
          borderColor: 'rgb(236, 72, 153)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => `Sales: ${context.parsed.y}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Sales'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Hour of Day'
            }
          }
        }
      }
    };

    this.charts.push(new Chart(ctx, config));
  }

  private createTopProductsChart(): void {
    const ctx = this.topProductsCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const topProducts = this.getTopProductsData();

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: topProducts.labels,
        datasets: [{
          label: 'Revenue (₹)',
          data: topProducts.data,
          backgroundColor: 'rgba(99, 102, 241, 0.8)',
          borderColor: 'rgb(99, 102, 241)',
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => `Revenue: ₹${(context.parsed.x || 0).toFixed(2)}`
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Revenue (₹)'
            }
          }
        }
      }
    };

    this.charts.push(new Chart(ctx, config));
  }

  private createSalesPersonChart(): void {
    const ctx = this.salesPersonCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const salesPersonData = this.getSalesPersonData();

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: salesPersonData.labels,
        datasets: [
          {
            label: 'Revenue (₹)',
            data: salesPersonData.revenue,
            backgroundColor: 'rgba(59, 130, 246, 0.7)',
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 1,
            yAxisID: 'y'
          },
          {
            label: 'Sales Count',
            data: salesPersonData.count,
            backgroundColor: 'rgba(16, 185, 129, 0.7)',
            borderColor: 'rgb(16, 185, 129)',
            borderWidth: 1,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                if (context.datasetIndex === 0) {
                  return `${label}: ₹${(context.parsed.y || 0).toFixed(2)}`;
                }
                return `${label}: ${context.parsed.y || 0}`;
              }
            }
          }
        },
        scales: {
          x: {
            ticks: {
              maxRotation: 0,
              autoSkip: false
            }
          },
          y: {
            type: 'linear',
            position: 'left',
            title: {
              display: true,
              text: 'Revenue (₹)'
            },
            beginAtZero: true
          },
          y1: {
            type: 'linear',
            position: 'right',
            title: {
              display: true,
              text: 'Sales Count'
            },
            beginAtZero: true,
            grid: {
              drawOnChartArea: false
            }
          }
        }
      }
    };

    this.charts.push(new Chart(ctx, config));
  }

  private createDailyOverviewChart(): void {
    const ctx = this.dailyOverviewCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const dailyData = this.getDailySalesData();

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: dailyData.labels,
        datasets: [
          {
            label: 'Revenue (₹)',
            data: dailyData.revenue,
            backgroundColor: 'rgba(99, 102, 241, 0.8)',
            borderColor: 'rgb(99, 102, 241)',
            borderWidth: 1,
            yAxisID: 'y',
          },
          {
            label: 'Sales Count',
            data: dailyData.count,
            backgroundColor: 'rgba(16, 185, 129, 0.8)',
            borderColor: 'rgb(16, 185, 129)',
            borderWidth: 1,
            yAxisID: 'y1',
          }
        ]
      },
      options: {
        responsive: true,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
          }
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Revenue (₹)'
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Sales Count'
            },
            grid: {
              drawOnChartArea: false,
            },
          },
        }
      }
    };

    this.charts.push(new Chart(ctx, config));
  }

  private getDailySalesData(): { labels: string[], revenue: number[], count: number[] } {
    const groupedData = new Map<string, { revenue: number, count: number }>();

    this.sales.forEach(sale => {
      const date = new Date(sale.createdAt);
      const key = date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });

      if (!groupedData.has(key)) {
        groupedData.set(key, { revenue: 0, count: 0 });
      }

      const data = groupedData.get(key)!;
      data.revenue += sale.total;
      data.count += 1;
    });

    const sortedEntries = Array.from(groupedData.entries());

    return {
      labels: sortedEntries.map(([key]) => key),
      revenue: sortedEntries.map(([, data]) => data.revenue),
      count: sortedEntries.map(([, data]) => data.count)
    };
  }

  private getPaymentMethodData(): { labels: string[], data: number[] } {
    const paymentMethods: { [key: string]: number } = {
      'CASH': 0,
      'CARD': 0,
      'UPI': 0,
      'OTHER': 0
    };

    this.sales.forEach(sale => {
      const method = sale.paymentMethod?.toUpperCase() || 'OTHER';
      if (paymentMethods[method] !== undefined) {
        paymentMethods[method] += sale.total;
      } else {
        paymentMethods['OTHER'] += sale.total;
      }
    });

    return {
      labels: ['Cash', 'Card', 'UPI', 'Other'],
      data: [paymentMethods['CASH'], paymentMethods['CARD'], paymentMethods['UPI'], paymentMethods['OTHER']]
    };
  }

  private getHourlyData(): { labels: string[], data: number[] } {
    const hourlyData = new Array(24).fill(0);

    this.sales.forEach(sale => {
      const hour = new Date(sale.createdAt).getHours();
      hourlyData[hour]++;
    });

    return {
      labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      data: hourlyData
    };
  }

  private getTopProductsData(): { labels: string[], data: number[] } {
    const productRevenue = new Map<string, { name: string, revenue: number }>();

    this.sales.forEach(sale => {
      sale.items?.forEach(item => {
        const productId = item.productId || item.product?.id;
        const productName = item.product?.name || 'Unknown';

        if (!productRevenue.has(productId)) {
          productRevenue.set(productId, { name: productName, revenue: 0 });
        }

        const data = productRevenue.get(productId)!;
        data.revenue += item.total || (item.price * item.quantity);
      });
    });

    const sortedProducts = Array.from(productRevenue.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return {
      labels: sortedProducts.map(p => p.name),
      data: sortedProducts.map(p => p.revenue)
    };
  }

  private getSalesPersonData(): { labels: string[]; revenue: number[]; count: number[] } {
    const stats: Record<string, { revenue: number; count: number }> = {};

    this.sales.forEach(sale => {
      const name = sale.salesPersonName?.trim() || 'Unassigned';
      if (!stats[name]) {
        stats[name] = { revenue: 0, count: 0 };
      }
      stats[name].revenue += sale.total;
      stats[name].count += 1;
    });

    const entries = Object.entries(stats)
      .map(([name, value]) => ({ name, ...value }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    return {
      labels: entries.map(entry => entry.name),
      revenue: entries.map(entry => entry.revenue),
      count: entries.map(entry => entry.count)
    };
  }

  ngOnDestroy(): void {
    this.charts.forEach(chart => chart.destroy());
  }
}
