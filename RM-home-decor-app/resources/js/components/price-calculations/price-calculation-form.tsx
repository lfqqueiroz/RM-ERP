import { Calculator } from 'lucide-react';
import { ProductSearchSelect } from '@/components/product-search-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { PriceCalculationForm as FormState } from '@/hooks/use-price-calculation-form';
import type { PricingMode } from '@/types';
import { PriceCalculationSummary } from './price-calculation-summary';
import type { CalculationProduct, CalculationTrip } from './types';

type Props = {
    form: FormState;
    products: CalculationProduct[];
    expenseRecords: CalculationTrip[];
};

export function PriceCalculationForm({
    form,
    products,
    expenseRecords,
}: Props) {
    return (
        <div className="grid gap-6 rounded-xl border p-6">
            <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                    <Label htmlFor="calculation-product">Produto</Label>
                    <ProductSearchSelect
                        id="calculation-product"
                        products={products}
                        value={form.productId}
                        onChange={form.setProductId}
                    />
                    <FieldError message={form.errors.product_id} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="calculation-trip">Viagem</Label>
                    <select
                        id="calculation-trip"
                        value={form.expenseRecordId}
                        onChange={(event) =>
                            form.setExpenseRecordId(event.target.value)
                        }
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                        <option value="">Selecione a viagem</option>
                        {expenseRecords.map((record) => (
                            <option key={record.id} value={record.id}>
                                {record.description} —{' '}
                                {new Date(record.created_at).toLocaleDateString(
                                    'pt-BR',
                                )}
                            </option>
                        ))}
                    </select>
                    <FieldError message={form.errors.expense_record_id} />
                </div>

                <div className="grid gap-2">
                    <Label>Forma de cálculo do preço</Label>
                    <ToggleGroup
                        type="single"
                        variant="outline"
                        value={form.pricingMode}
                        onValueChange={(value) => {
                            if (value) {
                                form.setPricingMode(value as PricingMode);
                            }
                        }}
                        className="w-full"
                    >
                        <ToggleGroupItem value="margin" className="flex-1">
                            Markup (%)
                        </ToggleGroupItem>
                        <ToggleGroupItem value="manual" className="flex-1">
                            Valor final (R$)
                        </ToggleGroupItem>
                    </ToggleGroup>
                    <FieldError message={form.errors.pricing_mode} />
                </div>
            </div>

            <div className="grid gap-2 sm:max-w-xs">
                {form.isManualPrice ? (
                    <>
                        <Label htmlFor="manual-final-price">
                            Preço final desejado (R$)
                        </Label>
                        <Input
                            id="manual-final-price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.manualFinalPrice}
                            onChange={(event) =>
                                form.setManualFinalPrice(event.target.value)
                            }
                            placeholder="Ex.: 199,90"
                        />
                        <FieldError message={form.errors.final_price} />
                    </>
                ) : (
                    <>
                        <Label htmlFor="profit-margin">
                            Markup sobre o custo (%)
                        </Label>
                        <Input
                            id="profit-margin"
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.profitMargin}
                            onChange={(event) =>
                                form.setProfitMargin(event.target.value)
                            }
                            placeholder="Ex.: 30"
                            aria-describedby="profit-margin-hint"
                        />
                        {form.errors.profit_margin ? (
                            <FieldError message={form.errors.profit_margin} />
                        ) : (
                            <p
                                id="profit-margin-hint"
                                className="text-xs text-muted-foreground"
                            >
                                Percentual acrescido ao custo base. Ex.: 30%
                                sobre R$ 100 = R$ 130.
                            </p>
                        )}
                    </>
                )}
            </div>

            <PriceCalculationSummary
                productCost={form.productCost}
                tripCostPerProduct={form.tripCostPerProduct}
                baseCost={form.baseCost}
                finalPrice={form.finalPrice}
                markupPercent={form.markupPercent}
                marginPercent={form.marginPercent}
            />

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                    {form.isManualPrice
                        ? 'Preço final informado manualmente; markup e margem acima são calculados a partir dele.'
                        : 'Fórmula: (preço de custo + valor por produto da viagem) × (1 + markup ÷ 100).'}
                </p>
                <Button
                    type="button"
                    disabled={!form.canSave || form.isSaving}
                    onClick={form.save}
                >
                    <Calculator />
                    {form.isSaving
                        ? 'Salvando...'
                        : form.editingCalculation
                          ? 'Salvar alterações'
                          : 'Salvar preço de venda'}
                </Button>
                {form.editingCalculation && (
                    <Button
                        type="button"
                        variant="outline"
                        disabled={form.isSaving}
                        onClick={form.reset}
                    >
                        Cancelar edição
                    </Button>
                )}
            </div>
        </div>
    );
}

function FieldError({ message }: { message?: string }) {
    return message ? (
        <p className="text-sm text-destructive">{message}</p>
    ) : null;
}
