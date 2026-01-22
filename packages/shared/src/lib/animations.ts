export const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: 'easeOut'
        }
    },
    exit: {
        opacity: 0,
        y: -20,
        transition: {
            duration: 0.3
        }
    },
};

export const cardVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: {
        opacity: 1,
        scale: 1,
        transition: {
            delay: 0.2,
            duration: 0.4,
            type: 'spring',
            stiffness: 100
        }
    },
};

export const buttonVariants = {
    hover: {
        scale: 1.02,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    },
    tap: { scale: 0.98 },
};

export const inputFocusVariants = {
    focus: {
        scale: 1.01,
        boxShadow: '0 0 0 2px rgba(99, 102, 241, 0.2)', // Indigo-500 ring
        transition: {
            duration: 0.2
        }
    },
};

export const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            type: 'spring',
            stiffness: 100
        }
    }
};

export const listContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};
