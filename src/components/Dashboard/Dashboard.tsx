/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { useEffect, useState, useCallback } from "react";
import * as XLSX from "xlsx";

// Assuming you have imported these components from your shadcn/ui library setup
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// NEW: Import Select components for the dropdown filter
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ISpotResponse } from "@/types/spotTypes";

// --- INTERFACE DEFINITIONS (Unchanged) ---
export interface AttendanceSpotAddress {
  village: string;
  union: string;
  upozila: string;
  district: string;
}

export interface SpotDetails {
  _id: string;
  spotName: string;
  spotCode: string;
  password?: string;
  concernMobileNumber?: string;
  address?: {
    village?: string;
    union?: string;
    upozila?: string;
    district?: string;
  };
  [key: string]: any;
}

export interface AttendanceSummary {
  date: string;
  spotId: string;
  spotName: string;
  spotCode: string;
  concernMobileNumber?: string;
  address: AttendanceSpotAddress;
  female: number;
  male: number;
  child: number;
  spotDetails: SpotDetails;
}
// --- END INTERFACE DEFINITIONS ---

// 1. ADD 'attendanceType' TO DEFAULT FILTERS
const defaultFilters = {
  date: "",
  startDate: "",
  endDate: "",
  spotCode: "",
  concernMobileNumber: "",
  village: "",
  union: "",
  upozila: "",
  district: "",
  attendanceType: "", // Added filter field: "" (All), "female", "male", "child"
};

type FilterState = typeof defaultFilters;

const DashboardComp = () => {
  const [attendanceData, setAttendanceData] = useState<{
    success: boolean;
    message: string;
    data: AttendanceSummary[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [manualFetchTrigger, setManualFetchTrigger] = useState(0);

  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [spot, setSpot] = useState<ISpotResponse | null>();

  // --- apit fetch spot data

  useEffect(() => {
    const spotData = async () => {
      const res = await axios.get("http://localhost:5000/api/v1/spot");
      setSpot(res?.data);
    };
    spotData();
  }, []);

  console.log(attendanceData);
  // --- API FETCH LOGIC ---
  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      // Filter out empty values for cleaner API calls
      const queryParams = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== "")
      );

      const response = await axios.get(
        "http://localhost:5000/api/v1/attendance/get-all-attendance",
        { params: queryParams }
      );

      setAttendanceData({
        success: true,
        message: "Success",
        data: response.data.data.data || [],
      });
    } catch (error) {
      console.error("Error fetching attendance data:", error);
      setAttendanceData({
        success: false,
        message: "Error fetching data",
        data: [],
      });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Initial Data Fetch on Mount
  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // Data Fetch on 'Search' Button Click
  useEffect(() => {
    if (manualFetchTrigger > 0) {
      fetchAttendance();
    }
  }, [manualFetchTrigger, fetchAttendance]);

  // --- HANDLERS ---
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  // 2. NEW HANDLER FOR SELECT/DROPDOWN
  const handleSelectFilterChange = (name: keyof FilterState, value: string) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  const handleSearch = () => {
    setManualFetchTrigger((prev) => prev + 1);
  };

  const handleClearFilters = () => {
    setFilters(defaultFilters);
    // After clearing, immediately trigger a fresh fetch
    setManualFetchTrigger((prev) => prev + 1);
  };

  const exportToExcel = () => {
    if (!attendanceData || attendanceData?.data.length === 0) return;

    const wsData = attendanceData.data.map((row) => ({
      Date: row.date,
      "Spot Name": row.spotName,
      "Spot Code": row.spotCode,
      "Mobile Number": row.concernMobileNumber || "N/A",
      Village: row.address.village || "N/A",
      Union: row.address.union || "N/A",
      Upozila: row.address.upozila || "N/A",
      District: row.address.district || "N/A",
      Female: row.female,
      Male: row.male,
      Child: row.child,
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, "attendance.xlsx");
  };

  // --- RENDER ---
  return (
    <div className="p-4 space-y-6 container mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-800">
            📊 Attendance Dashboard
          </CardTitle>
          <p className="text-sm text-gray-500">
            Filter and view attendance summary data.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Attendance Type Filter (NEW DROPDOWN) */}
            <div className="space-y-1">
              <Label htmlFor="attendanceType">Attendance Type</Label>
              <Select
                value={filters.attendanceType}
                onValueChange={(value: any) =>
                  handleSelectFilterChange("attendanceType", value)
                }
              >
                <SelectTrigger id="attendanceType">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  {/* <SelectItem value="All">All Types</SelectItem> */}
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="child">Child</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {spot !== undefined ? (
              <div className="space-y-1">
                <Label htmlFor="SpotName&Code">SpotName & Code</Label>
                <Select
                  onValueChange={(value: any) =>
                    handleSelectFilterChange("spotCode", value)
                  }
                >
                  <SelectTrigger id="SpotName&Code">
                    <SelectValue placeholder="Select Spot" />
                  </SelectTrigger>
                  <SelectContent>
                    {spot?.data.map(
                      (s: any) => (
                        <SelectItem value={s.spotCode}>
                          {s.spotCode}-{s.spotName}
                        </SelectItem>
                      )
                      // console.log(s.spotName);
                    )}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              ""
            )}

            {/* Single Date Filter */}
            <div className="space-y-1">
              <Label htmlFor="date">Specific Date</Label>
              <Input
                id="date"
                type="date"
                name="date"
                value={filters.date}
                onChange={handleFilterChange}
              />
            </div>

            {/* Start Date Filter */}
            <div className="space-y-1">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
              />
            </div>

            {/* End Date Filter */}
            <div className="space-y-1">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
              />
            </div>

            {/* Spot Code Filter */}

            {/* Mobile Number Filter */}
            <div className="space-y-1">
              <Label htmlFor="concernMobileNumber">Mobile Number</Label>
              <Input
                id="concernMobileNumber"
                type="text"
                name="concernMobileNumber"
                value={filters.concernMobileNumber}
                onChange={handleFilterChange}
                placeholder="Enter mobile number"
              />
            </div>

            {/* Village Filter */}
            <div className="space-y-1">
              <Label htmlFor="village">Village</Label>
              <Input
                id="village"
                type="text"
                name="village"
                value={filters.village}
                onChange={handleFilterChange}
                placeholder="Enter village"
              />
            </div>

            {/* Union Filter */}
            <div className="space-y-1">
              <Label htmlFor="union">Union</Label>
              <Input
                id="union"
                type="text"
                name="union"
                value={filters.union}
                onChange={handleFilterChange}
                placeholder="Enter union"
              />
            </div>

            {/* Upozila Filter */}
            <div className="space-y-1">
              <Label htmlFor="upozila">Upozila</Label>
              <Input
                id="upozila"
                type="text"
                name="upozila"
                value={filters.upozila}
                onChange={handleFilterChange}
                placeholder="Enter upozila"
              />
            </div>

            {/* District Filter */}
            <div className="space-y-1">
              <Label htmlFor="district">District</Label>
              <Input
                id="district"
                type="text"
                name="district"
                value={filters.district}
                onChange={handleFilterChange}
                placeholder="Enter district"
              />
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={handleClearFilters}
              disabled={loading}
            >
              Clear Filters
            </Button>
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </Button>
            <Button variant="secondary" onClick={exportToExcel}>
              Export to Excel
            </Button>
            <Button variant="destructive" onClick={() => location.reload()}>
              Reload Page
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading Indicator */}
      {loading && (
        <div className="flex justify-center py-8">
          <p className="text-lg text-blue-600 font-semibold">
            Loading attendance data...
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Attendance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Table */}
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-100">
                  {[
                    "Date",
                    "Spot Name",
                    "Spot Code",
                    "Mobile Number",
                    "Village",
                    "Union",
                    "Upozila",
                    "District",
                    "Female",
                    "Male",
                    "Child",
                  ].map((header) => (
                    <TableHead key={header} className="whitespace-nowrap">
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceData?.data.length ? (
                  attendanceData.data.map((attendance, index) => (
                    <TableRow key={index}>
                      <TableCell className="whitespace-nowrap font-medium">
                        {attendance.date}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {attendance.spotName}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {attendance.spotCode}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {attendance.concernMobileNumber || "N/A"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {attendance.address.village || "N/A"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {attendance.address.union || "N/A"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {attendance.address.upozila || "N/A"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {attendance.address.district || "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        {attendance.female}
                      </TableCell>
                      <TableCell className="text-right">
                        {attendance.male}
                      </TableCell>
                      <TableCell className="text-right">
                        {attendance.child}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={11}
                      className="h-24 text-center text-gray-500"
                    >
                      No attendance found. Please adjust your filters and search
                      again.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardComp;
