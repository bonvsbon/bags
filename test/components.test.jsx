import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

// Mock the API so components never hit the network.
vi.mock('../src/api/client.js', () => ({
  tokens: { isAuthed: false, get access() { return null; }, set() {}, clear() {} },
  api: {
    listCategories: vi.fn(async () => []),
    listAccounts: vi.fn(async () => []),
    onboarding: vi.fn(async () => ({ profile_complete: true })),
    login: vi.fn(async () => ({ access: 'A', refresh: 'R' })),
    register: vi.fn(async () => ({ access: 'A', refresh: 'R' })),
    guest: vi.fn(async () => ({ access: 'A', refresh: 'R' })),
  },
}));

import AuthScreen from '../src/live/AuthScreen.jsx';
import { LiveAdd } from '../src/live/screens.jsx';
import { LiveOnboarding, LiveCreateGoal } from '../src/live/morescreens.jsx';

beforeEach(() => cleanup());

describe('AuthScreen', () => {
  it('prefills demo credentials and toggles the register tab', () => {
    render(<AuthScreen onAuth={() => {}} onExit={() => {}} />);
    expect(screen.getByPlaceholderText('อีเมล').value).toBe('demo@ngernthon.app');
    // login tab: no display-name field
    expect(screen.queryByPlaceholderText(/ชื่อที่อยากให้เรียก/)).toBeNull();
    fireEvent.click(screen.getByText('สมัครใหม่'));
    expect(screen.getByPlaceholderText(/ชื่อที่อยากให้เรียก/)).toBeInTheDocument();
  });
});

describe('LiveAdd keypad', () => {
  it('builds the amount from keypresses and backspaces', () => {
    render(<LiveAdd back={() => {}} toast={() => {}} />);
    fireEvent.click(screen.getByText('2'));
    fireEvent.click(screen.getByText('5'));
    fireEvent.click(screen.getByText('0'));
    expect(screen.getByText('250')).toBeInTheDocument();
    fireEvent.click(screen.getByText('⌫'));
    expect(screen.getByText('25')).toBeInTheDocument();
  });
});

describe('LiveCreateGoal', () => {
  it('shows the computed ETA from target and monthly contribution', () => {
    render(<LiveCreateGoal back={() => {}} toast={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText('0'), { target: { value: '40000' } });
    // default monthly is 5000 -> 40000 / 5000 = 8 months
    expect(screen.getByText(/8 เดือน/)).toBeInTheDocument();
  });
});

describe('LiveOnboarding', () => {
  it('walks all 4 steps and calls onboarding on finish', async () => {
    const { api } = await import('../src/api/client.js');
    const onDone = vi.fn();
    render(<LiveOnboarding onDone={onDone} toast={() => {}} />);

    expect(screen.getByText('เงินเดือนออกวันไหน')).toBeInTheDocument();
    fireEvent.click(screen.getByText('วันที่ 25'));
    fireEvent.click(screen.getByText('ถัดไป'));

    expect(screen.getByText(/รายได้ต่อเดือน/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('฿30,000'));
    fireEvent.click(screen.getByText('ถัดไป'));

    expect(screen.getByText('มีค่าใช้จ่ายประจำอะไรบ้าง')).toBeInTheDocument();
    fireEvent.click(screen.getByText('ถัดไป'));

    expect(screen.getByText('เป้าหมายหลักของคุณ')).toBeInTheDocument();
    fireEvent.click(screen.getByText('เริ่มใช้งาน'));

    await waitFor(() => expect(api.onboarding).toHaveBeenCalled());
    expect(api.onboarding).toHaveBeenCalledWith(
      expect.objectContaining({ pay_day: 25, monthly_income: 30000, primary_goal: 'leftover' }),
    );
    await waitFor(() => expect(onDone).toHaveBeenCalled());
  });
});
