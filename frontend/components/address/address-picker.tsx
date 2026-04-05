'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
    ghnService,
    type GHNProvince,
    type GHNDistrict,
    type GHNWard,
} from '@/services/ghn.service';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface AddressPickerProps {
    onAddressChange: (data: {
        provinceId: number;
        provinceName: string;
        districtId: number;
        districtName: string;
        wardCode: string;
        wardName: string;
    }) => void;
    initialValues?: {
        provinceId?: number;
        districtId?: number;
        wardCode?: string;
    };
}

export function AddressPicker({ onAddressChange, initialValues }: AddressPickerProps) {
    const [provinces, setProvinces] = useState<GHNProvince[]>([]);
    const [districts, setDistricts] = useState<GHNDistrict[]>([]);
    const [wards, setWards] = useState<GHNWard[]>([]);

    const [provinceId, setProvinceId] = useState<number | null>(initialValues?.provinceId || null);
    const [districtId, setDistrictId] = useState<number | null>(initialValues?.districtId || null);
    const [wardCode, setWardCode] = useState<string>(initialValues?.wardCode || '');

    useEffect(() => {
        ghnService.getProvinces().then(setProvinces).catch(() => setProvinces([]));
    }, []);

    useEffect(() => {
        if (!provinceId) {
            setDistricts([]);
            return;
        }
        ghnService.getDistricts(provinceId).then(setDistricts).catch(() => setDistricts([]));
    }, [provinceId]);

    useEffect(() => {
        if (!districtId) {
            setWards([]);
            return;
        }
        ghnService.getWards(districtId).then(setWards).catch(() => setWards([]));
    }, [districtId]);

    useEffect(() => {
        if (provinceId && districtId && wardCode) {
            const p = provinces.find((p) => p.ProvinceID === provinceId);
            const d = districts.find((d) => d.DistrictID === districtId);
            const w = wards.find((w) => w.WardCode === wardCode);

            if (p && d && w) {
                onAddressChange({
                    provinceId,
                    provinceName: p.ProvinceName,
                    districtId,
                    districtName: d.DistrictName,
                    wardCode,
                    wardName: w.WardName,
                });
            }
        }
    }, [provinceId, districtId, wardCode, provinces, districts, wards]);

    const t = useTranslations('address');

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
                <Label className="text-[10px] font-bold tracking-widest uppercase text-stone-400 pl-2">{t('province_label')}</Label>
                <Select
                    value={provinceId ?? ''}
                    onChange={(e) => {
                        setProvinceId(Number(e.target.value));
                        setDistrictId(null);
                        setWardCode('');
                    }}
                >
                    <option value="">{t('province_placeholder')}</option>
                    {provinces.map((p) => (
                        <option key={p.ProvinceID} value={p.ProvinceID}>
                            {p.ProvinceName}
                        </option>
                    ))}
                </Select>
            </div>

            <div className="space-y-2">
                <Label className="text-[10px] font-bold tracking-widest uppercase text-stone-400 pl-2">{t('district_label')}</Label>
                <Select
                    value={districtId ?? ''}
                    onChange={(e) => {
                        setDistrictId(Number(e.target.value));
                        setWardCode('');
                    }}
                    disabled={!provinceId}
                >
                    <option value="">{t('district_placeholder')}</option>
                    {districts.map((d) => (
                        <option key={d.DistrictID} value={d.DistrictID}>
                            {d.DistrictName}
                        </option>
                    ))}
                </Select>
            </div>

            <div className="space-y-2">
                <Label className="text-[10px] font-bold tracking-widest uppercase text-stone-400 pl-2">{t('ward_label')}</Label>
                <Select
                    value={wardCode}
                    onChange={(e) => setWardCode(e.target.value)}
                    disabled={!districtId}
                >
                    <option value="">{t('ward_placeholder')}</option>
                    {wards.map((w) => (
                        <option key={w.WardCode} value={w.WardCode}>
                            {w.WardName}
                        </option>
                    ))}
                </Select>
            </div>
        </div>
    );
}
