'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { sellFinanceSectionSchema } from '@propvest/shared';

interface Props {
  initialData: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

export default function SellFinanceSection({ initialData, onNext, onBack }: Props) {
  const form = useForm<any>({
    resolver: zodResolver(sellFinanceSectionSchema) as any,
    defaultValues: initialData ?? {
      mortgageInterestRate: '',
      financeNotes: '',
    },
    mode: 'onChange',
  });

  const { register, handleSubmit, formState: { errors, isValid } } = form;

  const onSubmit = (raw: any) => {
    const data: any = {
      ...raw,
      mortgageInterestRate: raw.mortgageInterestRate != null && raw.mortgageInterestRate !== ''
        ? Number(raw.mortgageInterestRate) / 100
        : undefined,
    };
    onNext(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <h2 className="text-xl font-semibold">Finance</h2>

      <div>
        <label className="block text-sm text-slate-300 mb-1">Mortgage Interest Rate (%)</label>
        <div className="flex gap-2 items-center">
          <input type="number" min={0} max={100} step={0.1} {...register('mortgageInterestRate', { valueAsNumber: true })}
            className="input-field max-w-[200px]" placeholder="5" />
          <span className="text-slate-400">%</span>
        </div>
        {errors.mortgageInterestRate && <p className="text-red-400 text-xs mt-1">{String(errors.mortgageInterestRate.message ?? '')}</p>}
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-1">Finance Notes</label>
        <textarea {...register('financeNotes')} className="input-field w-full" rows={3} placeholder="e.g. 75% LTV interest-only, product fee £999" />
      </div>

      <div className="flex justify-between pt-4 border-t border-deep-600">
        <button type="button" onClick={onBack} className="btn-secondary">Back</button>
        <button type="submit" disabled={!isValid} className="btn-primary disabled:opacity-30">Next</button>
      </div>
    </form>
  );
}
