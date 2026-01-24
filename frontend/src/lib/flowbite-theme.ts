export const customTheme = {
    button: {
        color: {
            primary: 'bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 text-white dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800',
        },
        size: {
            md: 'text-sm px-5 py-2.5',
        },
    },
    card: {
        root: {
            base: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg',
            children: 'p-6',
        },
    },
    table: {
        root: {
            base: 'w-full text-left text-sm',
            shadow: 'shadow-md',
            wrapper: 'relative overflow-x-auto',
        },
        head: {
            base: 'group/head text-xs uppercase',
            cell: {
                base: 'bg-gray-100 dark:bg-gray-700 px-6 py-3 text-gray-700 dark:text-gray-300',
            },
        },
        body: {
            base: 'group/body divide-y divide-gray-200 dark:divide-gray-700',
            cell: {
                base: 'px-6 py-4 text-gray-900 dark:text-gray-200',
            },
        },
        row: {
            base: 'group/row bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700',
            striped: 'odd:bg-white even:bg-gray-50 odd:dark:bg-gray-800 even:dark:bg-gray-900',
        },
    },
    checkbox: {
        root: {
            base: 'w-4 h-4 bg-gray-100 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600',
        },
    },
    input: {
        field: {
            base: 'block w-full border disabled:cursor-not-allowed disabled:opacity-50',
            input: {
                base: 'bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500',
                sizes: {
                    md: 'p-2.5 text-sm',
                },
            },
        },
    },
    select: {
        field: {
            base: 'block w-full border disabled:cursor-not-allowed disabled:opacity-50',
            select: {
                base: 'bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500',
                sizes: {
                    md: 'p-2.5 text-sm',
                },
            },
        },
    },
    label: {
        root: {
            base: 'text-sm font-medium text-gray-900 dark:text-gray-300',
        },
    },
    alert: {
        root: {
            base: 'flex flex-col gap-2 p-4 text-sm rounded-lg',
            color: {
                red: 'bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-200',
            },
        },
    },
    tabs: {
        base: 'flex flex-col gap-2',
        tablist: {
            base: 'flex text-center',
            styles: {
                underline: 'flex-wrap -mb-px border-b border-gray-200 dark:border-gray-700',
            },
            tabitem: {
                base: 'flex items-center justify-center p-4 text-sm font-medium first:ml-0 disabled:cursor-not-allowed disabled:text-gray-400 disabled:dark:text-gray-500 focus:ring-4 focus:ring-blue-300 focus:outline-none',
                styles: {
                    underline: {
                        base: 'rounded-t-lg',
                        active: {
                            on: 'text-blue-600 rounded-t-lg border-b-2 border-blue-600 active dark:text-blue-500 dark:border-blue-500',
                            off: 'border-b-2 border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300',
                        },
                    },
                },
            },
        },
        tabpanel: 'py-3',
    },
} as const;