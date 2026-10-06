//! Allocation profiling is enabled for memory runs and disabled for timing-only runs.

use std::{
    alloc::{GlobalAlloc, Layout, System},
    sync::atomic::{AtomicBool, AtomicUsize, Ordering},
};

struct CountingAllocator;
static TRACKING: AtomicBool = AtomicBool::new(true);
pub(super) static LIVE_BYTES: AtomicUsize = AtomicUsize::new(0);
pub(super) static PEAK_BYTES: AtomicUsize = AtomicUsize::new(0);
pub(super) static TOTAL_ALLOCATED_BYTES: AtomicUsize = AtomicUsize::new(0);
pub(super) static ALLOCATION_COUNT: AtomicUsize = AtomicUsize::new(0);
fn allocated(size: usize) {
    let live = LIVE_BYTES.fetch_add(size, Ordering::Relaxed) + size;
    PEAK_BYTES.fetch_max(live, Ordering::Relaxed);
    TOTAL_ALLOCATED_BYTES.fetch_add(size, Ordering::Relaxed);
    ALLOCATION_COUNT.fetch_add(1, Ordering::Relaxed);
}
// SAFETY: every operation delegates the caller's pointer/layout unchanged to System.
unsafe impl GlobalAlloc for CountingAllocator {
    unsafe fn alloc(&self, layout: Layout) -> *mut u8 {
        // SAFETY: GlobalAlloc's caller provides a valid layout.
        let pointer = unsafe { System.alloc(layout) };
        if !pointer.is_null() && is_enabled() {
            allocated(layout.size());
        }
        pointer
    }
    unsafe fn dealloc(&self, pointer: *mut u8, layout: Layout) {
        if is_enabled() {
            LIVE_BYTES.fetch_sub(layout.size(), Ordering::Relaxed);
        }
        // SAFETY: the pointer and layout are the original System allocation.
        unsafe { System.dealloc(pointer, layout) };
    }
    unsafe fn realloc(&self, pointer: *mut u8, layout: Layout, size: usize) -> *mut u8 {
        // SAFETY: caller supplies the live allocation and a valid new size.
        let next = unsafe { System.realloc(pointer, layout, size) };
        if !next.is_null() && is_enabled() {
            LIVE_BYTES.fetch_sub(layout.size(), Ordering::Relaxed);
            allocated(size);
        }
        next
    }
}
#[global_allocator]
static GLOBAL: CountingAllocator = CountingAllocator;

pub(super) fn disable() {
    TRACKING.store(false, Ordering::Relaxed);
}
pub(super) fn is_enabled() -> bool {
    TRACKING.load(Ordering::Relaxed)
}
