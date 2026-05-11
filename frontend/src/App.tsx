import { useEffect, useState } from "react";
import axios from "axios";
import { AlertCircle, Box, Scale, Banknote, Zap, TrendingDown, Camera, Layers, MapPin, ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";

interface SiteData {
    site_id: string;
    metadata: {
        material_id: string;
        material_type: string;
        status: string;
        last_updated: string;
    };
    kpi_metrics: {
        current_volume_m3: number;
        current_mass_kg: number;
        net_change_kg: number;
        usage_velocity_kg_per_period: number;
        auto_refill_trigger_date: string;
    };
    frontend_chart_data: {
        x_labels: string[];
        y_values_kg: number[];
    };
    frontend_image_assets: {
        raw_images: string[];
        ai_mask_images: string[];
        depth_topology_images: string[];
        standalone_chart: string;
    };
}

export default function App() {
  const [sites, setSites] = useState<SiteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSiteIdx, setSelectedSiteIdx] = useState(0);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      const res = await axios.get("/sites");
      setSites(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sites.length > 0) {
        const daysLen = sites[selectedSiteIdx].frontend_chart_data.x_labels.length;
        setSelectedDayIdx(daysLen - 1);
    }
  }, [selectedSiteIdx, sites]);

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse font-sans font-semibold">Loading Live Site Data...</div>;
  if (!sites.length) return <div className="p-8 text-center text-red-500 font-sans font-semibold">No sites found.</div>;

  const currentSite = sites[selectedSiteIdx];
  const days = currentSite.frontend_chart_data.x_labels;
  const safeDayIdx = Math.min(selectedDayIdx, days.length - 1);
  const currentDayLabel = days[safeDayIdx];
  const currentYValue = currentSite.frontend_chart_data.y_values_kg[safeDayIdx] || 0;
  
  // Calculate day over day change
  const previousYValue = safeDayIdx > 0 ? currentSite.frontend_chart_data.y_values_kg[safeDayIdx - 1] : currentYValue;
  const netChange = currentYValue - previousYValue;
  const isLoss = netChange < 0;
  const isGain = netChange > 0;
  const absChange = Math.abs(netChange);
  const costImpact = absChange * 0.2; // Derived $ value of movement
  
  const currentImgName = currentSite.frontend_image_assets.raw_images[safeDayIdx];
  const currentImgUrl = `/data_assets/${currentSite.site_id}/${currentImgName}`;
  const aiOverlayImgUrl = `/data_assets/${currentSite.site_id}/${currentSite.frontend_image_assets.ai_mask_images[safeDayIdx]}`;

  const chartData = days.map((day, idx) => ({
      day: day,
      inventory_kg: currentSite.frontend_chart_data.y_values_kg[idx],
      burn_rate: idx === 0 ? 0 : Math.abs(currentSite.frontend_chart_data.y_values_kg[idx] - currentSite.frontend_chart_data.y_values_kg[idx-1]),
      value_usd: currentSite.frontend_chart_data.y_values_kg[idx] * 0.2
  }));

  const totalValue = currentSite.frontend_chart_data.y_values_kg[currentSite.frontend_chart_data.y_values_kg.length - 1] * 0.2;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-screen-2xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Construction Material Tracking</h1>
                <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-500" /> Site Overview Dashboard
                </p>
              </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
             {sites.map((site, i) => (
                 <button
                    key={site.site_id}
                    onClick={() => { setSelectedSiteIdx(i); }}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                        i === selectedSiteIdx 
                            ? 'bg-indigo-600 shadow-md shadow-indigo-200 text-white' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                 >
                    <MapPin className="w-4 h-4" />
                    {site.metadata.material_id.replace(/_/g, ' ')}
                 </button>
             ))}
          </div>
        </div>

        {/* Selected Site KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 border-l-4 border-l-blue-500">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <Scale className="w-4 h-4 text-blue-500" />
              <h3 className="font-semibold text-xs uppercase tracking-wider">Total Material Mass</h3>
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {(currentSite.kpi_metrics.current_mass_kg / 1000).toFixed(2)} <span className="text-lg text-slate-500 font-medium">Tons</span>
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 border-l-4 border-l-indigo-500">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <Box className="w-4 h-4 text-indigo-500" />
              <h3 className="font-semibold text-xs uppercase tracking-wider">Measured Volume</h3>
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {currentSite.kpi_metrics.current_volume_m3.toFixed(2)} <span className="text-lg text-slate-500 font-medium">m³</span>
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 border-l-4 border-l-emerald-500">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <Banknote className="w-4 h-4 text-emerald-500" />
              <h3 className="font-semibold text-xs uppercase tracking-wider">Total Material Value</h3>
            </div>
            <p className="text-3xl font-bold text-emerald-600">
              $ {totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-lg text-emerald-600/60 font-medium">USD</span>
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 border-l-4 border-l-amber-500">
             <div className="flex items-center gap-2 text-slate-500 mb-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <h3 className="font-semibold text-xs uppercase tracking-wider">Material Status</h3>
            </div>
            <p className="text-xl md:text-2xl font-bold text-amber-600 mt-1 uppercase tracking-tight">
              {currentSite.metadata.status}
            </p>
          </div>
        </div>

        {/* Date Timeline Scrubber */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-center sticky top-4 z-10">
          <div className="flex bg-slate-100 p-1.5 rounded-lg overflow-x-auto">
             {days.map((d, i) => (
                 <button
                    key={i}
                    onClick={() => setSelectedDayIdx(i)}
                    className={`whitespace-nowrap px-6 py-2 text-sm font-bold rounded-md transition-all ${
                        i === safeDayIdx 
                            ? 'bg-white shadow-sm text-indigo-700' 
                            : 'text-slate-500 hover:text-slate-800'
                    }`}
                 >
                    {d}
                 </button>
             ))}
          </div>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            
            {/* Image viewer */}
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                   <div className="mb-4 border-b border-slate-100 pb-4">
                      <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                          <Camera className="w-6 h-6 text-indigo-500" />
                          Site Photo Log - {currentDayLabel}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">Review visual progress of the material on site.</p>
                  </div>

                  <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-200 bg-black relative group mb-4">
                    <img 
                        src={currentImgUrl} 
                        className="absolute inset-0 w-full h-full object-cover"
                        alt="Raw Site Feed"
                    />
                    <img 
                        src={aiOverlayImgUrl} 
                        className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        alt="Segmentation Overlay"
                    />
                    <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-xl pointer-events-none"></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex flex-col justify-center items-center text-center">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Inventory Left</span>
                        <div className="text-2xl font-black text-slate-800 mt-1">{currentYValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-base text-slate-500 font-medium">kg</span></div>
                     </div>
                     <div className={`p-4 border rounded-xl flex flex-col justify-center items-center text-center ${absChange === 0 ? 'bg-slate-50 border-slate-100' : isGain ? 'bg-blue-50 border-blue-100' : 'bg-amber-50 border-amber-100'}`}>
                        <span className={`text-xs font-bold uppercase tracking-widest ${absChange === 0 ? 'text-slate-500' : isGain ? 'text-blue-700' : 'text-amber-700'}`}>MATERIAL {isGain ? 'ADDED' : isLoss ? 'USED' : 'CHANGE'}</span>
                        <div className={`text-2xl font-black mt-1 flex items-center gap-1 ${absChange === 0 ? 'text-slate-800' : isGain ? 'text-blue-700' : 'text-amber-700'}`}>
                           {isGain ? <ArrowUpRight className="w-5 h-5"/> : isLoss ? <ArrowDownRight className="w-5 h-5"/> : null}
                           {absChange.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-base font-medium opacity-70">kg</span>
                           {previousYValue > 0 && <span className="text-sm ml-1 font-semibold">({((absChange / previousYValue) * 100).toFixed(1)}%)</span>}
                        </div>
                     </div>
                     <div className={`p-4 border rounded-xl flex flex-col justify-center items-center text-center ${absChange === 0 ? 'bg-slate-50 border-slate-100' : 'bg-emerald-50 border-emerald-100'}`}>
                        <span className={`text-xs font-bold uppercase tracking-widest ${absChange === 0 ? 'text-slate-500' : 'text-emerald-700'}`}>VALUE OF CHANGE</span>
                        <div className={`text-2xl font-black mt-1 ${absChange === 0 ? 'text-slate-800' : 'text-emerald-700'}`}>
                           ${costImpact.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                     </div>
                  </div>
                </div>
            </div>

            {/* Historical Trends */}
            <div className="space-y-6">
               
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <div className="mb-6 flex justify-between items-end">
                      <div>
                          <h3 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                              <TrendingDown className="w-6 h-6 text-blue-500" />
                              Overall Material Inventory
                          </h3>
                          <p className="text-base text-slate-500 mt-1">Track how much material is available on site over time.</p>
                      </div>
                  </div>
                  <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                              <defs>
                                  <linearGradient id="colorMat" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15}/>
                                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                                  </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 13, fontWeight: 500}} />
                              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 13, fontWeight: 500}} tickFormatter={(v)=>`${(v/1000).toFixed(0)}T`} />
                              <Tooltip 
                                cursor={{stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4'}} 
                                contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                                  formatter={(value: any) => [`${Number(value).toLocaleString()} kg`, 'Inventory']}
                              />
                              <Area type="monotone" dataKey="inventory_kg" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorMat)" name="Inventory" />
                          </AreaChart>
                      </ResponsiveContainer>
                  </div>
              </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                      <div className="mb-4">
                          <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-1.5">
                              <Banknote className="w-5 h-5 text-emerald-500" />
                              Total Value On Site
                          </h3>
                          <p className="text-sm text-slate-500 mt-1">Financial value of stored materials.</p>
                      </div>
                      <div className="h-40 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                  <defs>
                                      <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                      </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} hide />
                                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} tickFormatter={(v)=>`$${v}`} />
                                  <Tooltip cursor={{stroke: '#cbd5e1'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                  <Area type="monotone" dataKey="value_usd" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorSpend)" name="USD Value" />
                              </AreaChart>
                          </ResponsiveContainer>
                      </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                      <div className="mb-4">
                          <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-1.5">
                              <Zap className="w-5 h-5 text-indigo-500" />
                              Material Usage
                          </h3>
                          <p className="text-sm text-slate-500 mt-1">Volume added or removed per day.</p>
                      </div>
                      <div className="h-40 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} hide />
                                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} tickFormatter={(v)=>`${v}`} />
                                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0'}} />
                                  <Bar dataKey="burn_rate" fill="#818CF8" radius={[4, 4, 0, 0]} barSize={20} name="Amount Changed (kg)" />
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                  </div>
              </div>

            </div>
        </div>

      </div>
    </div>
  );
}
