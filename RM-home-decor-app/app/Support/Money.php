<?php

namespace App\Support;

use InvalidArgumentException;

/**
 * Aritmética monetária em centavos inteiros, sem passar por float.
 *
 * Valores decimais entram e saem como string ("12.34"), no mesmo formato das
 * colunas decimal(12,2) e do cast `decimal:2`. Todo arredondamento é half-up
 * (metade se afasta do zero), igual ao round() do PHP usado anteriormente.
 */
final class Money
{
    /**
     * Converte um valor decimal em centavos. Casas além da segunda são
     * arredondadas half-up ("33.335" → 3334).
     */
    public static function toCents(string|int|float $value): int
    {
        if (is_int($value)) {
            return $value * 100;
        }

        if (is_float($value)) {
            $value = sprintf('%.10F', $value);
        }

        $value = trim($value);

        if (! preg_match('/^(-?)(\d*)(?:\.(\d*))?$/', $value, $matches) || ($matches[2] === '' && ($matches[3] ?? '') === '')) {
            throw new InvalidArgumentException("Valor monetário inválido: [{$value}].");
        }

        $sign = $matches[1] === '-' ? -1 : 1;
        $fraction = str_pad($matches[3] ?? '', 3, '0');
        $cents = (int) $matches[2] * 100 + (int) substr($fraction, 0, 2);

        if ((int) $fraction[2] >= 5) {
            $cents++;
        }

        return $sign * $cents;
    }

    /**
     * Converte centavos para string decimal com duas casas (1234 → "12.34").
     */
    public static function fromCents(int $cents): string
    {
        $sign = $cents < 0 ? '-' : '';
        $cents = abs($cents);

        return sprintf('%s%d.%02d', $sign, intdiv($cents, 100), $cents % 100);
    }

    /**
     * Acrescenta um percentual (até duas casas) ao valor: 1000 com "30" → 1300.
     */
    public static function applyPercent(int $cents, string|int|float $percent): int
    {
        $basisPoints = self::toCents($percent);

        return self::divideRounded($cents * (10000 + $basisPoints), 10000);
    }

    /**
     * Divide um valor em centavos por um inteiro, arredondando half-up.
     */
    public static function divide(int $cents, int $divisor): int
    {
        if ($divisor === 0) {
            throw new InvalidArgumentException('Divisão por zero.');
        }

        return self::divideRounded($cents, $divisor);
    }

    private static function divideRounded(int $dividend, int $divisor): int
    {
        $quotient = intdiv($dividend, $divisor);
        $remainder = $dividend % $divisor;

        if (abs($remainder) * 2 >= abs($divisor)) {
            $quotient += ($dividend < 0) === ($divisor < 0) ? 1 : -1;
        }

        return $quotient;
    }
}
