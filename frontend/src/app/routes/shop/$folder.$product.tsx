import { HttpCacheHeaderTaggerFromLoader, StoreFrontAwaretHttpCacheHeaderTagger } from '~/core/Http-Cache-Tagger';
import { useLocalCart } from '~/core/hooks/useLocalCart';
import { HeadersFunction, json, LoaderFunction, MetaFunction } from '@remix-run/node';
import { useLoaderData, useLocation } from '@remix-run/react';
import { Image } from '@crystallize/reactjs-components/dist/image';
import StockIcon from '~/assets/stockIcon.svg';
import { useEffect, useState } from 'react';
import { VariantSelector } from '~/core/components/variant-selector';
import { ProductBody } from '~/core/components/product-body';
import { Cart } from '~/core/components/cart';
import { RelatedProduct } from '~/core/components/related-items/related-product';
import { getStoreFront } from '~/core/storefront/storefront.server';
import { CrystallizeAPI } from '~/core/use-cases/crystallize';

export const headers: HeadersFunction = ({ loaderHeaders }) => {
    return HttpCacheHeaderTaggerFromLoader(loaderHeaders).headers;
};

export let meta: MetaFunction = ({ data }: { data: any }) => {
    let metaData = data?.product?.meta?.content?.chunks?.[0];

    return {
        title: `${metaData?.[0]?.content?.text}`,
        description: `${metaData?.[1]?.content?.plainText}`,
        'og:image': `${metaData?.[2]?.content?.firstImage?.url}`,
    };
};

export const loader: LoaderFunction = async ({ request, params }) => {
    const url = new URL(request.url);
    const preview = url.searchParams.get('preview');
    const version = preview ? 'draft' : 'published';
    const path = `/shop/${params.folder}/${params.product}`;
    const { shared, secret } = await getStoreFront(request.headers.get('Host')!);
    const product = await CrystallizeAPI.fetchProduct(secret.apiClient, path, version);
    return json({ product }, StoreFrontAwaretHttpCacheHeaderTagger('30s', '30s', [path], shared.config));
};

export default function ProductPage() {
    const { product } = useLoaderData();
    let [selectedVariant, setSelectedVariant] = useState(product?.variants[0]);
    let [showCart, setShowCart] = useState(false);
    let location = useLocation();

    let title = product?.components?.find((component: any) => component.type === 'singleLine')?.content?.text;
    let description = product?.components?.find((component: any) => component.type === 'richText')?.content?.plainText;

    const { add } = useLocalCart();

    const onVariantChange = (variant: any) => setSelectedVariant(variant);

    const handleClick = () => {
        add(selectedVariant);
        setShowCart(true);
    };
    let relatedProducts = product?.components?.find((component: any) => component.id === 'related-items')?.content
        ?.items;

    useEffect(() => {
        setSelectedVariant(product?.variants?.[0]);
    }, [location.pathname]);

    return (
        <div className="container p-8 px-202xl mx-auto w-full ">
            {showCart ? <Cart /> : null}
            <div className="flex gap-20">
                <div className="w-4/6 img-container">
                    <div className="img-container overflow-hidden rounded-md">
                        <Image {...selectedVariant?.images?.[0]} sizes="(max-width: 500px) 300px, 500px" />
                    </div>
                    <ProductBody components={product?.components} />
                </div>
                <div className="w-2/6">
                    <div className="flex flex-col gap-5 sticky top-8">
                        <h1 className="font-bold text-4xl">{title}</h1>
                        <p>{description}</p>
                        <VariantSelector
                            variants={product.variants}
                            selectedVariant={selectedVariant}
                            onVariantChange={onVariantChange}
                        />
                        <div className="flex justify-between items-center">
                            <p className="font-bold">€{selectedVariant?.price}</p>
                            <button
                                className="bg-buttonBg2 px-10 py-3 rounded font-buttonText font-bold hover:bg-pink"
                                onClick={() => {
                                    handleClick();
                                }}
                            >
                                Add to Cart
                            </button>
                        </div>

                        <hr className="bg-[#dfdfdf] mt-5" />
                        <div className="flex gap-3 items-center">
                            <img src={`${StockIcon}`} />
                            <p>
                                More than{' '}
                                <span className="font-bold">{product?.variants[0]?.stockLocations[0]?.stock}</span> in
                                stock
                            </p>
                            <div className="w-2.5 h-2.5 rounded-full bg-green"></div>
                        </div>
                    </div>
                </div>
            </div>
            {relatedProducts && (
                <div className="w-full">
                    <h3 className="font-bold mt-20 mb-10 text-xl">You might also be interested in</h3>
                    <div className="flex gap-5 overflow-x-scroll grid grid-cols-5 snap-mandatory snap-x scroll-p-0 pb-5">
                        {relatedProducts?.map((item: any, index: number) => (
                            <div key={index} onClick={() => setSelectedVariant('')}>
                                <RelatedProduct product={item} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
