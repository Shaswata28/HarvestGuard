import { useState } from "react";
import { useLanguage } from "@/context/LangContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  mockFarmers,
  mockFarmerCropBatches,
  mockLossEvents,
  mockInterventions,
  getSuccessRate,
  getTotalLossPercentage,
} from "@/data/mockAdminData";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingDown, CheckCircle2, Users, Sprout, AlertTriangle } from "lucide-react";
import { toBanglaDigits } from "@/lib/utils";

export default function AdminDashboard() {
  const { language } = useLanguage();

  const activeBatches = mockFarmerCropBatches.filter((b) => b.status === "active");
  const totalLossPercentage = getTotalLossPercentage();

  const lossEventsByType = mockLossEvents.reduce(
    (acc, event) => {
      const existing = acc.find((e) => e.name === event.event_type);
      if (existing) {
        existing.value += event.loss_weight;
        existing.count += 1;
      } else {
        acc.push({ name: event.event_type, value: event.loss_weight, count: 1 });
      }
      return acc;
    },
    [] as Array<{ name: string; value: number; count: number }>
  );

  const displayNum = (num: number | string) => {
    return language === "bn" ? toBanglaDigits(num) : num;
  };

  return (
    <div className="space-y-8 pb-10 p-4 md:p-8 bg-slate-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            {language === "bn" ? "প্রশাসক ড্যাশবোর্ড" : "Admin Overview"}
          </h1>
          <p className="text-slate-500">
            {language === "bn"
              ? "কৃষি কার্যক্রম এবং ঝুঁকি মনিটরিং প্যানেল"
              : "Agricultural monitoring and risk assessment panel"}
          </p>
        </div>
        <div className="bg-white p-2 rounded-lg border shadow-sm text-sm font-medium">
          {new Date().toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { dateStyle: 'full' })}
        </div>
      </div>

      {/* KPI Cards - Clean & Minimal */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={<Users className="w-6 h-6 text-primary" />}
          label={language === "bn" ? "মোট কৃষক" : "Total Farmers"}
          value={displayNum(mockFarmers.length)}
          trend="+12%"
          trendUp={true}
        />
        <KPICard
          icon={<Sprout className="w-6 h-6 text-emerald-600" />}
          label={language === "bn" ? "সক্রিয় ব্যাচ" : "Active Batches"}
          value={displayNum(activeBatches.length)}
          trend="+5%"
          trendUp={true}
        />
        <KPICard
          icon={<AlertTriangle className="w-6 h-6 text-amber-600" />}
          label={language === "bn" ? "ঝুঁকিপূর্ণ এলাকা" : "High Risk Areas"}
          value={displayNum(2)}
          trend="Stable"
        />
        <KPICard
          icon={<TrendingDown className="w-6 h-6 text-rose-600" />}
          label={language === "bn" ? "গড় ক্ষতি" : "Avg. Loss Rate"}
          value={`${displayNum(totalLossPercentage.toFixed(1))}%`}
          trend="-2.5%"
          trendUp={true} // loss going down is good
          inverse={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Charts Section */}
        <Card className="lg:col-span-2 shadow-sm border-slate-200">
           <CardHeader>
            <CardTitle>
              {language === "bn" ? "ক্ষতির কারণ বিশ্লেষণ" : "Loss Analysis by Type"}
            </CardTitle>
            <CardDescription>
              {language === "bn" ? "বিভিন্ন কারণে ফসলের ক্ষতির পরিমাণ (কেজি)" : "Total crop loss weight in kg"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lossEventsByType} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="value" fill="#e11d48" radius={[0, 4, 4, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
           <CardHeader>
            <CardTitle>
              {language === "bn" ? "হস্তক্ষেপ সাফল্য" : "Intervention Success"}
            </CardTitle>
            <CardDescription>
              {language === "bn" ? "গৃহীত পদক্ষেপের ফলাফল" : "Outcome of advisory actions"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex justify-center items-center">
               <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Success', value: mockInterventions.filter(i => i.success).length },
                      { name: 'Failed', value: mockInterventions.filter(i => !i.success).length },
                    ]}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#22c55e" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MAIN DATA TABLES */}
      <div className="space-y-8">
        
        {/* Crop Batches List */}
        <Card className="shadow-sm overflow-hidden border-0 ring-1 ring-slate-200">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-800">
              {language === "bn" ? "ফসল ব্যাচ তালিকা" : "Crop Batches"}
            </h2>
            <p className="text-sm text-slate-500">
              {language === "bn" ? "সকল কৃষকের ফসলের বর্তমান অবস্থা" : "Real-time status of all farmer crops"}
            </p>
          </div>
          
          {/* Responsive Table Container */}
          <div className="overflow-x-auto w-full">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="whitespace-nowrap">{language === "bn" ? "ব্যাচ আইডি" : "Batch ID"}</TableHead>
                  <TableHead className="whitespace-nowrap">{language === "bn" ? "কৃষকের নাম" : "Farmer Name"}</TableHead>
                  <TableHead className="whitespace-nowrap">{language === "bn" ? "ফসল" : "Crop"}</TableHead>
                  <TableHead className="whitespace-nowrap">{language === "bn" ? "ওজন" : "Weight"}</TableHead>
                  <TableHead className="whitespace-nowrap">{language === "bn" ? "সংরক্ষণ" : "Storage"}</TableHead>
                  <TableHead className="whitespace-nowrap">{language === "bn" ? "তারিখ" : "Date"}</TableHead>
                  <TableHead className="text-right whitespace-nowrap">{language === "bn" ? "অবস্থা" : "Status"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockFarmerCropBatches.map((batch) => (
                  <TableRow key={batch.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-mono text-xs text-slate-500 whitespace-nowrap">{batch.batch_number}</TableCell>
                    <TableCell className="font-medium whitespace-nowrap">{batch.farmer_name}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
                        {batch.crop_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{displayNum(batch.weight)} {language === 'bn' ? 'কেজি' : 'kg'}</TableCell>
                    <TableCell className="text-slate-600 whitespace-nowrap">{batch.storage_type}</TableCell>
                    <TableCell className="text-slate-600 text-sm whitespace-nowrap">{displayNum(batch.created_at)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <StatusBadge status={batch.status} language={language} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Recent Loss Events Table */}
          <Card className="shadow-sm border-0 ring-1 ring-slate-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-500" />
                {language === "bn" ? "সাম্প্রতিক ক্ষতির রিপোর্ট" : "Recent Loss Reports"}
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto w-full">
              <Table>
                <TableHeader className="bg-red-50/30">
                  <TableRow>
                    <TableHead className="whitespace-nowrap">{language === "bn" ? "কারণ" : "Cause"}</TableHead>
                    <TableHead className="whitespace-nowrap">{language === "bn" ? "ক্ষতি" : "Loss"}</TableHead>
                    <TableHead className="text-right whitespace-nowrap">{language === "bn" ? "এলাকা" : "Location"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockLossEvents.slice(0, 5).map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {event.event_type}
                        <div className="text-xs text-slate-400 mt-0.5">{displayNum(event.date)}</div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="text-red-600 font-bold">{displayNum(event.loss_weight)} {language === 'bn' ? 'কেজি' : 'kg'}</span>
                        <span className="text-xs text-slate-400 ml-1">({displayNum(event.loss_percentage)}%)</span>
                      </TableCell>
                      <TableCell className="text-right text-sm text-slate-600 whitespace-nowrap">
                        {event.location}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Interventions Table */}
          <Card className="shadow-sm border-0 ring-1 ring-slate-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                {language === "bn" ? "হস্তক্ষেপ রেকর্ড" : "Intervention Log"}
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto w-full">
              <Table>
                <TableHeader className="bg-green-50/30">
                  <TableRow>
                    <TableHead className="whitespace-nowrap">{language === "bn" ? "পদক্ষেপ" : "Action Taken"}</TableHead>
                    <TableHead className="text-right whitespace-nowrap">{language === "bn" ? "ফলাফল" : "Result"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockInterventions.slice(0, 5).map((int) => (
                    <TableRow key={int.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="font-medium">{int.intervention_type}</div>
                        <div className="text-xs text-slate-500 truncate max-w-[200px]" title={int.notes}>{int.notes}</div>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {int.success ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
                            {language === "bn" ? "সফল" : "Success"}
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
                            {language === "bn" ? "ব্যর্থ" : "Failed"}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}

function KPICard({ icon, label, value, trend, trendUp, inverse }: any) {
  const trendColor = inverse 
    ? (trendUp ? "text-green-600" : "text-red-600") 
    : (trendUp ? "text-green-600" : "text-slate-500");

  return (
    <Card className="border-0 ring-1 ring-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="text-3xl font-bold text-slate-900">{value}</p>
          </div>
          <div className="p-2 bg-slate-50 rounded-lg">
            {icon}
          </div>
        </div>
        {trend && (
          <div className={`text-xs font-medium mt-2 ${trendColor} flex items-center gap-1`}>
            {trendUp ? "↑" : "↓"} {trend} 
            <span className="text-slate-400 font-normal ml-1">vs last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status, language }: { status: string, language: string }) {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span>
        {language === 'bn' ? 'চলমান' : 'Active'}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
      {language === 'bn' ? 'সম্পন্ন' : 'Completed'}
    </span>
  );
}