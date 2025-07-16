import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Company, Vessel, User } from '@/types';

interface AdminState {
  companies: Company[];
  vessels: Vessel[];
  users: User[];
  departments: Department[];
  currentCompany: Company | null;
  isLoading: boolean;
  error: string | null;
}

interface Department {
  id: string;
  name: string;
  description: string;
  managerId?: string;
  managerName?: string;
  employeeCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const initialState: AdminState = {
  companies: [],
  vessels: [],
  users: [],
  departments: [],
  currentCompany: null,
  isLoading: false,
  error: null
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setCompanies: (state, action: PayloadAction<Company[]>) => {
      state.companies = action.payload;
    },
    setCurrentCompany: (state, action: PayloadAction<Company | null>) => {
      state.currentCompany = action.payload;
    },
    setVessels: (state, action: PayloadAction<Vessel[]>) => {
      state.vessels = action.payload;
    },
    addVessel: (state, action: PayloadAction<Vessel>) => {
      state.vessels.push(action.payload);
    },
    updateVessel: (state, action: PayloadAction<Vessel>) => {
      const index = state.vessels.findIndex(v => v.id === action.payload.id);
      if (index !== -1) {
        state.vessels[index] = action.payload;
      }
    },
    deleteVessel: (state, action: PayloadAction<string>) => {
      state.vessels = state.vessels.filter(v => v.id !== action.payload);
    },
    setUsers: (state, action: PayloadAction<User[]>) => {
      state.users = action.payload;
    },
    addUser: (state, action: PayloadAction<User>) => {
      state.users.push(action.payload);
    },
    updateUser: (state, action: PayloadAction<User>) => {
      const index = state.users.findIndex(u => u.id === action.payload.id);
      if (index !== -1) {
        state.users[index] = action.payload;
      }
    },
    deleteUser: (state, action: PayloadAction<string>) => {
      state.users = state.users.filter(u => u.id !== action.payload);
    },
    setDepartments: (state, action: PayloadAction<Department[]>) => {
      state.departments = action.payload;
    },
    addDepartment: (state, action: PayloadAction<Department>) => {
      state.departments.push(action.payload);
    },
    updateDepartment: (state, action: PayloadAction<Department>) => {
      const index = state.departments.findIndex(d => d.id === action.payload.id);
      if (index !== -1) {
        state.departments[index] = action.payload;
      }
    },
    deleteDepartment: (state, action: PayloadAction<string>) => {
      state.departments = state.departments.filter(d => d.id !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    }
  }
});

export const {
  setCompanies,
  setCurrentCompany,
  setVessels,
  addVessel,
  updateVessel,
  deleteVessel,
  setUsers,
  addUser,
  updateUser,
  deleteUser,
  setDepartments,
  addDepartment,
  updateDepartment,
  deleteDepartment,
  setLoading,
  setError
} = adminSlice.actions;

export default adminSlice.reducer;