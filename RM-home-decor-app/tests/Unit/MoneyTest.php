<?php

namespace Tests\Unit;

use App\Support\Money;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class MoneyTest extends TestCase
{
    /**
     * @return array<string, array{0: string|int|float, 1: int}>
     */
    public static function toCentsProvider(): array
    {
        return [
            'string com duas casas' => ['12.34', 1234],
            'string sem casas' => ['80', 8000],
            'string com uma casa' => ['45.5', 4550],
            'string iniciando em ponto' => ['.5', 50],
            'inteiro' => [150, 15000],
            'float' => [199.9, 19990],
            'float impreciso' => [0.1 + 0.2, 30],
            'zero' => ['0.00', 0],
            'terceira casa arredonda para cima' => ['33.335', 3334],
            'terceira casa arredonda para baixo' => ['33.334', 3333],
            'negativo' => ['-1.255', -126],
        ];
    }

    #[DataProvider('toCentsProvider')]
    public function test_to_cents(string|int|float $value, int $expected): void
    {
        $this->assertSame($expected, Money::toCents($value));
    }

    public function test_to_cents_rejects_invalid_values(): void
    {
        $this->expectException(InvalidArgumentException::class);

        Money::toCents('12,34');
    }

    public function test_from_cents(): void
    {
        $this->assertSame('12.34', Money::fromCents(1234));
        $this->assertSame('0.05', Money::fromCents(5));
        $this->assertSame('0.00', Money::fromCents(0));
        $this->assertSame('-1.26', Money::fromCents(-126));
    }

    public function test_apply_percent(): void
    {
        $this->assertSame(15000, Money::applyPercent(10000, '50'));
        $this->assertSame(1333, Money::applyPercent(1000, '33.33'));
        $this->assertSame(1000, Money::applyPercent(1000, 0));
        // 2948,65 × 10,10 = 29781,365: empate exato arredonda para cima.
        // Com float o resultado era 29781,36 (29781,36499999...).
        $this->assertSame(2978137, Money::applyPercent(294865, '910'));
    }

    public function test_divide_rounds_half_up(): void
    {
        $this->assertSame(3333, Money::divide(10000, 3));
        $this->assertSame(6667, Money::divide(20000, 3));
        $this->assertSame(1, Money::divide(1, 2));
        $this->assertSame(0, Money::divide(0, 7));
    }

    public function test_divide_by_zero_is_rejected(): void
    {
        $this->expectException(InvalidArgumentException::class);

        Money::divide(100, 0);
    }
}
