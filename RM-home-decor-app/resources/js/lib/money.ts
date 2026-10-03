const currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
});

/** Formata um valor (string decimal do backend ou número) como moeda (R$). */
export function formatMoney(value: string | number): string {
    return currencyFormatter.format(Number(value));
}

/** Formata um percentual com até duas casas: 23.0769 → "23,08%". */
export function formatPercent(value: number): string {
    return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
}

/**
 * Converte um valor decimal em centavos, arredondando half-up na terceira
 * casa — mesma regra de App\Support\Money::toCents no backend.
 */
export function toCents(value: string | number): bigint {
    const text = (typeof value === 'number' ? value.toFixed(10) : value).trim();
    const match = /^(-?)(\d*)(?:\.(\d*))?$/.exec(text);

    if (!match || (match[2] === '' && (match[3] ?? '') === '')) {
        return 0n;
    }

    const sign = match[1] === '-' ? -1n : 1n;
    const fraction = (match[3] ?? '').padEnd(3, '0');
    let cents = BigInt(match[2] || '0') * 100n + BigInt(fraction.slice(0, 2));

    if (Number(fraction[2]) >= 5) {
        cents += 1n;
    }

    return sign * cents;
}

/** Converte centavos para número (apenas para exibição). */
export function fromCents(cents: bigint): number {
    return Number(cents) / 100;
}

/**
 * Prévia do preço pelo markup, em centavos inteiros — mesma conta de
 * App\Support\Money::applyPercent, para a prévia bater com o valor salvo.
 * O valor gravado continua sendo o calculado no backend.
 */
export function calculateMarkupPrice(
    baseCostCents: bigint,
    markupPercent: string | number,
): bigint {
    const basisPoints = toCents(markupPercent);
    const dividend = baseCostCents * (10000n + basisPoints);
    const divisor = 10000n;
    const quotient = dividend / divisor;
    const remainder = dividend % divisor;
    const absRemainder = remainder < 0n ? -remainder : remainder;

    if (absRemainder * 2n >= divisor) {
        return quotient + (dividend < 0n ? -1n : 1n);
    }

    return quotient;
}

/**
 * Divide centavos por um inteiro com arredondamento half-up — mesma regra de
 * App\Support\Money::divide (custo da viagem rateado por produto).
 */
export function divideCents(cents: bigint, divisor: number): bigint {
    if (divisor <= 0) {
        return 0n;
    }

    const bigDivisor = BigInt(divisor);
    const quotient = cents / bigDivisor;
    const remainder = cents % bigDivisor;
    const absRemainder = remainder < 0n ? -remainder : remainder;

    if (absRemainder * 2n >= bigDivisor) {
        return quotient + (cents < 0n ? -1n : 1n);
    }

    return quotient;
}
